'use strict';
const stringWidth = require('string-width');
const stripAnsi = require('strip-ansi');
const ansiStyles = require('ansi-styles');

const ESCAPES = new Set([
	'\u001B',
	'\u009B'
]);

const END_CODE = 39;

const wrapAnsi = code => `${ESCAPES.values().next().value}[${code}m`;

// Calculate the length of words split on ' ', ignoring
// the extra characters added by ansi escape codes
const wordLengths = string => string.split(' ').map(character => stringWidth(character));

// Wrap a long word across multiple rows
// Ansi escape codes do not count towards length
const wrapWord = (rows, word, columns) => {
	const characters = [...word];

	let insideEscape = false;
	let visible = stringWidth(stripAnsi(rows[rows.length - 1]));

	for (const [index, character] of characters.entries()) {
		const characterLength = stringWidth(character);

		if (visible + characterLength <= columns) {
			rows[rows.length - 1] += character;
		} else {
			rows.push(character);
			visible = 0;
		}

		if (ESCAPES.has(character)) {
			insideEscape = true;
		} else if (insideEscape && character === 'm') {
			insideEscape = false;
			continue;
		}

		if (insideEscape) {
			continue;
		}

		visible += characterLength;

		if (visible === columns && index < characters.length - 1) {
			rows.push('');
			visible = 0;
		}
	}

	// It's possible that the last row we copy over is only
	// ansi escape characters, handle this edge-case
	if (!visible && rows[rows.length - 1].length > 0 && rows.length > 1) {
		rows[rows.length - 2] += rows.pop();
	}
};

// The wrap-ansi module can be invoked
// in either 'hard' or 'soft' wrap mode
//
// 'hard' will never allow a string to take up more
// than columns characters
//
// 'soft' allows long words to expand past the column length
const exec = (string, columns, options = {}) => {
	if (string.trim() === '') {
		return options.trim === false ? string : string.trim();
	}

	let pre = '';
	let ret = '';
	let escapeCode;

	const lengths = wordLengths(string);
	const rows = [''];

	// Strings with spaces wrapped into escapes like chalk.bgRed(' test ')
	// get split up into 3 words, because of .split(' '), which results in incorrect rendering of that string.
	// To prevent that, we need to normalize result of .split() and avoid splitting strings wrapped into ansi escapes
	const stringParts = string.split(' ');
	let normalizedStringParts = [];

	// Look for all background color ansi escapes
	const bgColorEscape = /(\u001b\[(4[0-7]|10[0-7])m.*?\u001b\[49m)/g
	let match
	let lastMatch

	while ((match = bgColorEscape.exec(string)) !== null) {
		if (normalizedStringParts.length === 0) {
			// Add string part before first background color escape
			normalizedStringParts.push(...string.slice(0, match.index).split(' ').slice(0, -1))
		}

		normalizedStringParts.push(match[0])
		lastMatch = match
	}

	if (lastMatch) {
		// Add remaining string after last background color escape
		const remainingString = string.slice(lastMatch.index + lastMatch[0].length)

		if (remainingString.length > 0) {
			normalizedStringParts.push(...remainingString.split(' ').slice(0, -1))
		}
	} else {
		// If there is no match, it means there are no background color escapes
		normalizedStringParts = stringParts
	}

	for (const [index, word] of normalizedStringParts.entries()) {
		rows[rows.length - 1] = options.trim === false ? rows[rows.length - 1] : rows[rows.length - 1].trim();
		let rowLength = stringWidth(rows[rows.length - 1]);

		if ((rowLength || word === '')) {
			if (rowLength === columns && options.wordWrap === false) {
				// If we start with a new word but the current row length equals the length of the columns, add a new row
				rows.push('');
				rowLength = 0;
			}

			rows[rows.length - 1] += ' ';
			rowLength++;
		}

		// In 'hard' wrap mode, the length of a line is
		// never allowed to extend past 'columns'
		if (lengths[index] > columns && options.hard) {
			if (rowLength) {
				rows.push('');
			}
			wrapWord(rows, word, columns);
			continue;
		}

		if (rowLength + lengths[index] > columns && rowLength > 0) {
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

	pre = rows.map(row => options.trim === false ? row : row.trim()).join('\n');

	for (const [index, character] of [...pre].entries()) {
		ret += character;

		if (ESCAPES.has(character)) {
			const code = parseFloat(/\d[^m]*/.exec(pre.slice(index, index + 4)));
			escapeCode = code === END_CODE ? null : code;
		}

		const code = ansiStyles.codes.get(Number(escapeCode));

		if (escapeCode && code) {
			if (pre[index + 1] === '\n') {
				ret += wrapAnsi(code);
			} else if (character === '\n') {
				ret += wrapAnsi(escapeCode);
			}
		}
	}

	return ret;
};

// For each newline, invoke the method separately
module.exports = (string, columns, options) => {
	return String(string)
		.normalize()
		.split('\n')
		.map(line => exec(line, columns, options))
		.join('\n');
};
