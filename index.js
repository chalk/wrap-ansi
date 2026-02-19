import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';
import ansiStyles from 'ansi-styles';

const ANSI_ESCAPE = '\u001B';
const ANSI_ESCAPE_CSI = '\u009B';
const ESCAPES = new Set([
	ANSI_ESCAPE,
	ANSI_ESCAPE_CSI,
]);

const END_CODE = 39;
const ANSI_ESCAPE_BELL = '\u0007';
const ANSI_CSI = '[';
const ANSI_OSC = ']';
const ANSI_SGR_TERMINATOR = 'm';
const ANSI_ESCAPE_LINK = `${ANSI_OSC}8;;`;
const ANSI_ESCAPE_REGEX = new RegExp(`^\\u001B(?:\\${ANSI_CSI}(?<code>\\d+)${ANSI_SGR_TERMINATOR}|${ANSI_ESCAPE_LINK}(?<uri>[^\\u0007\\u001B]*)(?:\\u0007|\\u001B\\\\))`);
const ANSI_ESCAPE_CSI_REGEX = new RegExp(`^\\u009B(?<code>\\d+)${ANSI_SGR_TERMINATOR}`);

const wrapAnsiCode = code => `${ANSI_ESCAPE}${ANSI_CSI}${code}${ANSI_SGR_TERMINATOR}`;
const wrapAnsiHyperlink = url => `${ANSI_ESCAPE}${ANSI_ESCAPE_LINK}${url}${ANSI_ESCAPE_BELL}`;

// Calculate the length of words split on ' ', ignoring
// the extra characters added by ANSI escape codes
const wordLengths = string => string.split(' ').map(word => stringWidth(word));

// Wrap a long word across multiple rows
// ANSI escape codes do not count towards length
const wrapWord = (rows, word, columns) => {
	const characters = [...word];

	let isInsideEscape = false;
	let isInsideLinkEscape = false;
	let visible = stringWidth(stripAnsi(rows.at(-1)));

	for (const [index, character] of characters.entries()) {
		const characterLength = stringWidth(character);

		if (visible + characterLength <= columns) {
			rows[rows.length - 1] += character;
		} else {
			rows.push(character);
			visible = 0;
		}

		if (ESCAPES.has(character) && !(isInsideLinkEscape && character === ANSI_ESCAPE && characters[index + 1] === '\\')) {
			isInsideEscape = true;

			const ansiEscapeLinkCandidate = characters.slice(index + 1, index + 1 + ANSI_ESCAPE_LINK.length).join('');
			isInsideLinkEscape = ansiEscapeLinkCandidate === ANSI_ESCAPE_LINK;
		}

		if (isInsideEscape) {
			if (isInsideLinkEscape) {
				if (
					character === ANSI_ESCAPE_BELL
					|| (character === '\\' && index > 0 && characters[index - 1] === ANSI_ESCAPE) // ST terminator (ESC \)
				) {
					isInsideEscape = false;
					isInsideLinkEscape = false;
				}
			} else if (character === ANSI_SGR_TERMINATOR) {
				isInsideEscape = false;
			}

			continue;
		}

		visible += characterLength;

		if (visible === columns && index < characters.length - 1) {
			rows.push('');
			visible = 0;
		}
	}

	// It's possible that the last row we copy over is only
	// ANSI escape characters, handle this edge-case
	if (!visible && rows.at(-1).length > 0 && rows.length > 1) {
		rows[rows.length - 2] += rows.pop();
	}
};

// Trims spaces from a string ignoring invisible sequences
const stringVisibleTrimSpacesRight = string => {
	const words = string.split(' ');
	let last = words.length;

	while (last > 0) {
		if (stringWidth(words[last - 1]) > 0) {
			break;
		}

		last--;
	}

	if (last === words.length) {
		return string;
	}

	return words.slice(0, last).join(' ') + words.slice(last).join('');
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

	let returnValue = '';
	let escapeCode;
	let escapeUrl;

	const lengths = wordLengths(string);
	let rows = [''];

	for (const [index, word] of string.split(' ').entries()) {
		if (options.trim !== false) {
			rows[rows.length - 1] = rows.at(-1).trimStart();
		}

		let rowLength = stringWidth(rows.at(-1));

		if (index !== 0) {
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
		if (options.hard && lengths[index] > columns) {
			const remainingColumns = columns - rowLength;
			const breaksStartingThisLine = 1 + Math.floor((lengths[index] - remainingColumns - 1) / columns);
			const breaksStartingNextLine = Math.floor((lengths[index] - 1) / columns);
			if (breaksStartingNextLine < breaksStartingThisLine) {
				rows.push('');
			}

			wrapWord(rows, word, columns);
			continue;
		}

		if (rowLength + lengths[index] > columns && rowLength > 0 && lengths[index] > 0) {
			if (options.wordWrap === false && rowLength < columns) {
				wrapWord(rows, word, columns);
				continue;
			}

			rows.push('');
		}

		if (rowLength + lengths[index] > columns && options.wordWrap === false) {
			wrapWord(rows, word, columns);
			continue;
		}

		rows[rows.length - 1] += word;
	}

	if (options.trim !== false) {
		rows = rows.map(row => stringVisibleTrimSpacesRight(row));
	}

	const preString = rows.join('\n');
	const pre = [...preString];

	// We need to keep a separate index as `String#slice()` works on Unicode code units, while `pre` is an array of codepoints.
	let preStringIndex = 0;

	for (const [index, character] of pre.entries()) {
		returnValue += character;

		if (character === ANSI_ESCAPE && pre[index + 1] !== '\\') {
			const {groups} = ANSI_ESCAPE_REGEX.exec(preString.slice(preStringIndex)) || {groups: {}};
			if (groups.code !== undefined) {
				const code = Number.parseInt(groups.code, 10);
				escapeCode = code === END_CODE ? undefined : code;
			} else if (groups.uri !== undefined) {
				escapeUrl = groups.uri.length === 0 ? undefined : groups.uri;
			}
		} else if (character === ANSI_ESCAPE_CSI) {
			const {groups} = ANSI_ESCAPE_CSI_REGEX.exec(preString.slice(preStringIndex)) || {groups: {}};
			if (groups.code !== undefined) {
				const code = Number.parseInt(groups.code, 10);
				escapeCode = code === END_CODE ? undefined : code;
			}
		}

		const code = ansiStyles.codes.get(Number(escapeCode));

		if (pre[index + 1] === '\n') {
			if (escapeUrl) {
				returnValue += wrapAnsiHyperlink('');
			}

			if (escapeCode && code) {
				returnValue += wrapAnsiCode(code);
			}
		} else if (character === '\n') {
			if (escapeCode && code) {
				returnValue += wrapAnsiCode(escapeCode);
			}

			if (escapeUrl) {
				returnValue += wrapAnsiHyperlink(escapeUrl);
			}
		}

		preStringIndex += character.length;
	}

	return returnValue;
};

// For each newline, invoke the method separately
export default function wrapAnsi(string, columns, options) {
	return String(string)
		.normalize()
		.replaceAll('\r\n', '\n')
		.split('\n')
		.map(line => exec(line, columns, options))
		.join('\n');
}
