import stringWidth from 'string-width';
import ansiStyles from 'ansi-styles';

const ANSI_ESCAPE = '\u001B';
const ANSI_ESCAPE_BELL = '\u0007';
const C1_CSI = '\u009B';
const ANSI_CSI = '[';
const ANSI_OSC = ']';
const ANSI_SGR_TERMINATOR = 'm';
const ANSI_SGR_RESET = 0;
const ANSI_SGR_RESET_FOREGROUND = 39;
const ANSI_SGR_RESET_BACKGROUND = 49;
const ANSI_SGR_RESET_UNDERLINE_COLOR = 59;
const ANSI_SGR_FOREGROUND_EXTENDED = 38;
const ANSI_SGR_BACKGROUND_EXTENDED = 48;
const ANSI_SGR_UNDERLINE_COLOR_EXTENDED = 58;
const ANSI_SGR_COLOR_MODE_RGB = 2;
const ANSI_SGR_COLOR_MODE_256 = 5;
const ANSI_ESCAPE_LINK = `${ANSI_OSC}8;`;
// The first character of every sequence we recognize.
const ESCAPES = new Set([
	ANSI_ESCAPE,
	C1_CSI,
]);
const ESCAPE_CHARACTERS = [...ESCAPES].join('');

const CSI_INTRODUCER = `(?:${ANSI_ESCAPE}\\${ANSI_CSI}|${C1_CSI})`;
const CSI_PARAMETERS = '[0-?]*[ -/]*[@-~]';
const SGR_PARAMETERS = `(?<sgr>[0-9;:]*)${ANSI_SGR_TERMINATOR}`;
const OSC_STRING_TERMINATOR = `(?:${ANSI_ESCAPE_BELL}|${ANSI_ESCAPE}\\\\)`;
const OSC_STRING_PAYLOAD = String.raw`[^\u0000-\u001F\u007F-\u009F]*`;
// A hyperlink is `OSC 8 ; parameters ; URI ST`, where `parameters` is a possibly empty list of `key=value` pairs joined by `:`.
const LINK_PARAMETERS = String.raw`8;(?<parameters>[^;\u0000-\u001F\u007F-\u009F]*);(?<uri>${OSC_STRING_PAYLOAD})${OSC_STRING_TERMINATOR}`;
const OSC_STRING = `${OSC_STRING_PAYLOAD}${OSC_STRING_TERMINATOR}`;

// Supported boundary: semicolon-delimited SGR styling, colon-delimited RGB/indexed colors, and OSC 8 hyperlinks are tracked, while ordinary CSI sequences and other complete 7-bit OSC commands are preserved as opaque zero-width units. This is intentionally not a terminal emulator, so other colon-delimited SGR semantics, C0 bytes inside sequences, DCS/SOS/PM/APC control strings, cancellations, generic ESC sequences, and 8-bit control-string forms are unsupported. Newlines always delimit input lines before ANSI parsing.
const ANSI_ESCAPE_REGEX = new RegExp(
	`${CSI_INTRODUCER}(?:${SGR_PARAMETERS}|${CSI_PARAMETERS})`
	+ `|${ANSI_ESCAPE}\\${ANSI_OSC}(?:${LINK_PARAMETERS}|${OSC_STRING})`,
	'y',
);

const ANSI_SGR_MODIFIER_CLOSE_CODES = new Set(ansiStyles.codes.values());
ANSI_SGR_MODIFIER_CLOSE_CODES.delete(ANSI_SGR_RESET);

const segmenter = new Intl.Segmenter();
// Complete ANSI sequences have already been removed before measuring these strings. Avoid string-width's ANSI scan so malformed sequences are not rescanned.
const getStringWidth = string => stringWidth(string, {countAnsiEscapeCodes: true});
const TAB_SIZE = 8;

// Finds the next character that could introduce a sequence, so plain text is skipped in one native step.
const ESCAPE_INTRODUCER_REGEX = new RegExp(`[${ESCAPE_CHARACTERS}]`, 'g');
// The final pass only cares about sequences and row boundaries, so it skips everything else in one native step.
const ROW_BOUNDARY_REGEX = new RegExp(`[\\n${ESCAPE_CHARACTERS}]`, 'g');
// Every printable ASCII character is its own grapheme cluster of width one, which lets the segmenter be skipped.
const ASCII_PRINTABLE_REGEX = /^[ -~]*$/;

const wrapAnsiCode = code => `${ANSI_ESCAPE}${ANSI_CSI}${code}${ANSI_SGR_TERMINATOR}`;
const wrapAnsiHyperlink = (url, parameters = '') => `${ANSI_ESCAPE}${ANSI_ESCAPE_LINK}${parameters};${url}${ANSI_ESCAPE_BELL}`;

// Match a complete escape sequence starting at `index`, or return `undefined` when none starts there.
const matchAnsiEscape = (string, index) => {
	if (!ESCAPES.has(string[index])) {
		return;
	}

	ANSI_ESCAPE_REGEX.lastIndex = index;
	return ANSI_ESCAPE_REGEX.exec(string) ?? undefined;
};

// Walk a string as alternating plain text runs and complete escape sequences.
// A character that looks like an introducer but does not start a valid sequence stays plain text.
const forEachSegment = (string, onPlainText, onEscape = () => {}) => {
	let plainStart = 0;
	let index = 0;

	while (index < string.length) {
		ESCAPE_INTRODUCER_REGEX.lastIndex = index;
		const introducer = ESCAPE_INTRODUCER_REGEX.exec(string);

		if (!introducer) {
			break;
		}

		const escape = matchAnsiEscape(string, introducer.index);

		if (!escape) {
			index = introducer.index + 1;
			continue;
		}

		if (introducer.index > plainStart) {
			onPlainText(string.slice(plainStart, introducer.index));
		}

		onEscape(escape[0]);
		index = introducer.index + escape[0].length;
		plainStart = index;
	}

	if (plainStart < string.length) {
		onPlainText(string.slice(plainStart));
	}
};

// The visible width of a string, ignoring escape sequences.
const getWidth = string => {
	let plainText = '';

	forEachSegment(string, part => {
		plainText += part;
	});

	return getStringWidth(plainText);
};

// Split a string into escape sequences, which are zero width and must never be split, and grapheme clusters.
// The supported boundary is between grapheme clusters and ANSI sequences; ANSI inserted inside a cluster is treated as separate segments.
const getTokens = string => {
	const tokens = [];

	forEachSegment(string, plainText => {
		if (ASCII_PRINTABLE_REGEX.test(plainText)) {
			for (const character of plainText) {
				tokens.push({value: character, width: 1});
			}

			return;
		}

		for (const {segment} of segmenter.segment(plainText)) {
			tokens.push({value: segment, width: getStringWidth(segment)});
		}
	}, escape => {
		tokens.push({value: escape, width: 0});
	});

	return tokens;
};

// Split on spaces, ignoring spaces that appear inside a recognized sequence.
const splitWords = string => {
	let currentWord = {value: '', plainText: ''};
	const words = [currentWord];

	forEachSegment(string, plainText => {
		const parts = plainText.split(' ');
		currentWord.value += parts[0];
		currentWord.plainText += parts[0];

		for (let index = 1; index < parts.length; index++) {
			currentWord = {value: parts[index], plainText: parts[index]};
			words.push(currentWord);
		}
	}, escape => {
		currentWord.value += escape;
	});

	// Measured once per word rather than per run, so a grapheme cluster split by an escape still counts once.
	for (const word of words) {
		word.width = getStringWidth(word.plainText);
	}

	return words;
};

const getColonColorToken = parameter => {
	const parts = parameter.split(':');
	const code = Number.parseInt(parts[0], 10);
	const mode = Number.parseInt(parts[1], 10);

	if (![ANSI_SGR_FOREGROUND_EXTENDED, ANSI_SGR_BACKGROUND_EXTENDED, ANSI_SGR_UNDERLINE_COLOR_EXTENDED].includes(code)) {
		return;
	}

	if (mode === ANSI_SGR_COLOR_MODE_256 && parts.length === 3 && /^\d+$/.test(parts[2])) {
		return {code, open: parameter, hasArguments: true};
	}

	if (mode !== ANSI_SGR_COLOR_MODE_RGB) {
		return;
	}

	const components = parts.length === 6 ? parts.slice(3) : parts.slice(2);
	const colorSpace = parts.length === 6 ? parts[2] : undefined;
	if (components.length === 3 && components.every(component => /^\d+$/.test(component)) && (colorSpace === undefined || /^\d*$/.test(colorSpace))) {
		return {code, open: parameter, hasArguments: true};
	}
};

const getSgrTokens = sgrParameters => {
	const parameters = sgrParameters.split(';');
	const sgrTokens = [];

	for (let index = 0; index < parameters.length; index++) {
		const parameter = parameters[index];
		if (parameter.includes(':')) {
			const colonColorToken = getColonColorToken(parameter);
			if (colonColorToken) {
				sgrTokens.push(colonColorToken);
			}

			continue;
		}

		const code = parameter === '' ? ANSI_SGR_RESET : Number.parseInt(parameter, 10);

		if (!Number.isFinite(code)) {
			continue;
		}

		if (code === ANSI_SGR_FOREGROUND_EXTENDED || code === ANSI_SGR_BACKGROUND_EXTENDED || code === ANSI_SGR_UNDERLINE_COLOR_EXTENDED) {
			if (index + 1 >= parameters.length) {
				break;
			}

			const mode = Number.parseInt(parameters[index + 1], 10);
			const colorIndex = Number.parseInt(parameters[index + 2], 10);
			if (mode === ANSI_SGR_COLOR_MODE_256 && Number.isFinite(colorIndex)) {
				sgrTokens.push({code, open: [code, mode, colorIndex].join(';'), hasArguments: true});
				index += 2;
				continue;
			}

			const red = Number.parseInt(parameters[index + 2], 10);
			const green = Number.parseInt(parameters[index + 3], 10);
			const blue = Number.parseInt(parameters[index + 4], 10);
			if (mode === ANSI_SGR_COLOR_MODE_RGB && Number.isFinite(red) && Number.isFinite(green) && Number.isFinite(blue)) {
				sgrTokens.push({code, open: [code, mode, red, green, blue].join(';'), hasArguments: true});
				index += 4;
				continue;
			}

			break;
		}

		sgrTokens.push({code, open: String(code), hasArguments: false});
	}

	return sgrTokens;
};

const removeActiveStyle = (activeStyles, family) => {
	const activeStyleIndex = activeStyles.findIndex(activeStyle => activeStyle.family === family);

	if (activeStyleIndex !== -1) {
		activeStyles.splice(activeStyleIndex, 1);
	}
};

const upsertActiveStyle = (activeStyles, nextActiveStyle) => {
	removeActiveStyle(activeStyles, nextActiveStyle.family);
	activeStyles.push(nextActiveStyle);
};

const removeModifierStylesByClose = (activeStyles, closeCode) => {
	for (let index = activeStyles.length - 1; index >= 0; index--) {
		const activeStyle = activeStyles[index];
		if (activeStyle.family.startsWith('modifier-') && activeStyle.close === closeCode) {
			activeStyles.splice(index, 1);
		}
	}
};

const getColorStyle = sgrToken => {
	const {code, open, hasArguments} = sgrToken;
	if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97) || (code === ANSI_SGR_FOREGROUND_EXTENDED && hasArguments)) {
		return {
			family: 'foreground',
			open,
			close: ANSI_SGR_RESET_FOREGROUND,
		};
	}

	if ((code >= 40 && code <= 47) || (code >= 100 && code <= 107) || (code === ANSI_SGR_BACKGROUND_EXTENDED && hasArguments)) {
		return {
			family: 'background',
			open,
			close: ANSI_SGR_RESET_BACKGROUND,
		};
	}

	if (code === ANSI_SGR_UNDERLINE_COLOR_EXTENDED && hasArguments) {
		return {
			family: 'underlineColor',
			open,
			close: ANSI_SGR_RESET_UNDERLINE_COLOR,
		};
	}
};

const applySgrResetCode = (code, activeStyles) => {
	if (code === ANSI_SGR_RESET) {
		activeStyles.length = 0;
		return true;
	}

	if (code === ANSI_SGR_RESET_FOREGROUND) {
		removeActiveStyle(activeStyles, 'foreground');
		return true;
	}

	if (code === ANSI_SGR_RESET_BACKGROUND) {
		removeActiveStyle(activeStyles, 'background');
		return true;
	}

	if (code === ANSI_SGR_RESET_UNDERLINE_COLOR) {
		removeActiveStyle(activeStyles, 'underlineColor');
		return true;
	}

	if (ANSI_SGR_MODIFIER_CLOSE_CODES.has(code)) {
		removeModifierStylesByClose(activeStyles, code);
		return true;
	}

	return false;
};

const applySgrToken = (sgrToken, activeStyles) => {
	const {code} = sgrToken;

	if (applySgrResetCode(code, activeStyles)) {
		return;
	}

	const colorStyle = getColorStyle(sgrToken);
	if (colorStyle) {
		upsertActiveStyle(activeStyles, colorStyle);
		return;
	}

	const close = ansiStyles.codes.get(code);
	if (close !== undefined && close !== ANSI_SGR_RESET) {
		upsertActiveStyle(activeStyles, {
			family: `modifier-${code}`,
			open: sgrToken.open,
			close,
		});
	}
};

const applySgrParameters = (sgrParameters, activeStyles) => {
	for (const sgrToken of getSgrTokens(sgrParameters)) {
		applySgrToken(sgrToken, activeStyles);
	}
};

const applySgrResets = (sgrParameters, activeStyles) => {
	for (const {code} of getSgrTokens(sgrParameters)) {
		applySgrResetCode(code, activeStyles);
	}
};

const applyLeadingSgrResets = (string, startIndex, activeStyles) => {
	let index = startIndex;

	while (index < string.length) {
		const match = matchAnsiEscape(string, index);
		if (!match) {
			break;
		}

		if (match.groups.sgr !== undefined) {
			applySgrResets(match.groups.sgr, activeStyles);
		}

		index += match[0].length;
	}
};

const getClosingSgrSequence = activeStyles => [...activeStyles].reverse().map(activeStyle => wrapAnsiCode(activeStyle.close)).join('');
const getOpeningSgrSequence = activeStyles => activeStyles.map(activeStyle => wrapAnsiCode(activeStyle.open)).join('');

// Wrap a long word across multiple rows
// ANSI escape codes do not count towards length
// Takes the visible width of the last row and returns the width of the row the word ends on, so callers never have to measure the rows themselves.
const wrapWord = (rows, word, columns, rowWidth) => {
	const tokens = getTokens(word);

	let visible = rowWidth;

	for (let index = 0; index < tokens.length; index++) {
		const token = tokens[index];

		// Escape sequences and combining marks are zero width, so they always stay on the current row.
		if (token.width > 0 && visible > 0 && visible + token.width > columns) {
			rows.push('');
			visible = 0;
		}

		rows[rows.length - 1] += token.value;
		visible += token.width;

		if (visible === columns && index < tokens.length - 1) {
			rows.push('');
			visible = 0;
		}
	}

	// It's possible that the last row we copy over is only
	// ANSI escape characters, handle this edge-case
	if (!visible && rows.at(-1).length > 0 && rows.length > 1) {
		rows[rows.length - 2] += rows.pop();
	}

	// The tokens are measured one by one, so a grapheme cluster that an escape sequence splits is counted once per part rather than once as a whole. Only the finished row tells the true width, and it is at most one row long to measure.
	return getWidth(rows.at(-1));
};

// Trims spaces from a string ignoring invisible sequences
const stringVisibleTrimSpacesRight = string => {
	if (!string.includes(' ')) {
		return string;
	}

	const segments = [];
	forEachSegment(string, plainText => {
		segments.push({value: plainText, isEscape: false});
	}, escape => {
		segments.push({value: escape, isEscape: true});
	});

	// Drop the spaces that trail the last visible character, but keep the invisible sequences among them.
	for (let index = segments.length - 1; index >= 0; index--) {
		const segment = segments[index];

		if (segment.isEscape) {
			continue;
		}

		// Scanned rather than matched with a regex, as a trailing-space pattern backtracks quadratically.
		let end = segment.value.length;
		while (end > 0 && segment.value[end - 1] === ' ') {
			end--;
		}

		segment.value = segment.value.slice(0, end);

		if (getStringWidth(segment.value) > 0) {
			break;
		}
	}

	return segments.map(segment => segment.value).join('');
};

const expandTabs = line => {
	if (!line.includes('\t')) {
		return line;
	}

	let visible = 0;
	let expandedLine = '';
	let plainTextSinceTab = '';

	const expandPlainText = plainText => {
		const segments = plainText.split('\t');

		for (const [index, segment] of segments.entries()) {
			expandedLine += segment;
			plainTextSinceTab += segment;

			if (index < segments.length - 1) {
				visible += getStringWidth(plainTextSinceTab);
				plainTextSinceTab = '';
				const spaces = TAB_SIZE - (visible % TAB_SIZE);
				expandedLine += ' '.repeat(spaces);
				visible += spaces;
			}
		}
	};

	forEachSegment(line, expandPlainText, escape => {
		expandedLine += escape;
	});

	return expandedLine;
};

// Close the active styles and hyperlink before every row break and reopen them after, so each row stands on its own.
// Only sequences and newlines matter here, so the string is scanned directly rather than split into grapheme clusters.
const restoreStylesAcrossRows = preString => {
	let returnValue = '';
	let activeHyperlink;
	const activeStyles = [];
	let index = 0;
	let copiedIndex = 0;

	while (index < preString.length) {
		ROW_BOUNDARY_REGEX.lastIndex = index;
		const boundary = ROW_BOUNDARY_REGEX.exec(preString);

		if (!boundary) {
			break;
		}

		index = boundary.index;

		if (boundary[0] !== '\n') {
			const escape = matchAnsiEscape(preString, index);

			if (!escape) {
				index++;
				continue;
			}

			const {groups} = escape;
			if (groups.sgr !== undefined) {
				applySgrParameters(groups.sgr, activeStyles);
			} else if (groups.uri !== undefined) {
				activeHyperlink = groups.uri.length === 0 ? undefined : {parameters: groups.parameters, uri: groups.uri};
			}

			index += escape[0].length;
			continue;
		}

		// Everything up to the row break is copied verbatim, sequences included.
		returnValue += preString.slice(copiedIndex, index);

		// An empty row never reopened anything, so there is nothing to close.
		if (index > copiedIndex) {
			if (activeHyperlink) {
				returnValue += wrapAnsiHyperlink('');
			}

			returnValue += getClosingSgrSequence(activeStyles);
		}

		returnValue += '\n';
		index++;
		copiedIndex = index;

		// An empty row has nothing to style, so the styles stay closed until the next row with content. A trailing row break leaves no row at all.
		if (index < preString.length && preString[index] !== '\n') {
			const openingStyles = [...activeStyles];
			applyLeadingSgrResets(preString, index, openingStyles);
			returnValue += getOpeningSgrSequence(openingStyles);

			if (activeHyperlink) {
				returnValue += wrapAnsiHyperlink(activeHyperlink.uri, activeHyperlink.parameters);
			}
		}
	}

	return returnValue + preString.slice(copiedIndex);
};

// The wrap-ansi module can be invoked in either 'hard' or 'soft' wrap mode.
//
// 'hard' will never allow a string to take up more than columns characters.
//
// 'soft' allows long words to expand past the column length.
const exec = (string, columns, options = {}) => {
	if (options.trim !== false && string.trim() === '') {
		return '';
	}

	const words = splitWords(string);
	let rows = [''];
	// Tracked as rows are built. Remeasuring the row for every word makes wrapping quadratic in the line length.
	let rowLength = 0;
	// Words are only ever appended, so a row that already starts with content can never become trimmable again. Retrimming it for every word makes wrapping quadratic in the line length.
	let trimmedRowIndex = -1;

	let isFirstWord = true;

	for (const word of words) {
		const rowIndex = rows.length - 1;

		if (options.trim !== false && trimmedRowIndex !== rowIndex) {
			const row = rows[rowIndex];
			const trimmedRow = row.trimStart();

			if (trimmedRow.length !== row.length) {
				rows[rowIndex] = trimmedRow;
				rowLength = getWidth(trimmedRow);
			}

			if (trimmedRow.length > 0) {
				trimmedRowIndex = rowIndex;
			}
		}

		if (isFirstWord) {
			isFirstWord = false;
		} else {
			if (rowLength >= columns && (options.wordWrap === false || options.trim === false)) {
				// If we start with a new word but the current row length equals the length of the columns, add a new row
				rows.push('');
				rowLength = 0;
			}

			if (rowLength > 0 || options.trim === false) {
				rows[rows.length - 1] += ' ';
				rowLength++;
			}
		}

		// In 'hard' wrap mode, the length of a line is never allowed to extend past 'columns'
		if (options.hard && options.wordWrap !== false && word.width > columns) {
			const remainingColumns = columns - rowLength;
			const breaksStartingThisLine = 1 + Math.floor((word.width - remainingColumns - 1) / columns);
			const breaksStartingNextLine = Math.floor((word.width - 1) / columns);
			if (breaksStartingNextLine < breaksStartingThisLine) {
				rows.push('');
				rowLength = 0;
			}

			rowLength = wrapWord(rows, word.value, columns, rowLength);
			continue;
		}

		if (rowLength + word.width > columns && rowLength > 0 && word.width > 0) {
			if (options.wordWrap === false && rowLength < columns) {
				rowLength = wrapWord(rows, word.value, columns, rowLength);
				continue;
			}

			rows.push('');
			rowLength = 0;
		}

		if (rowLength + word.width > columns && options.wordWrap === false) {
			rowLength = wrapWord(rows, word.value, columns, rowLength);
			continue;
		}

		rows[rows.length - 1] += word.value;
		rowLength += word.width;
	}

	if (options.trim !== false) {
		rows = rows.map(row => stringVisibleTrimSpacesRight(row));
	}

	return restoreStylesAcrossRows(rows.join('\n'));
};

// For each newline, invoke the method separately.
export default function wrapAnsi(string, columns, options) {
	return String(string)
		.normalize()
		.replaceAll('\r\n', '\n')
		.split('\n')
		.map(line => exec(expandTabs(line), columns, options))
		.join('\n');
}
