'use strict';
var spliceString = require('splice-string');

var ESCAPES = [
	'\u001b',
	'\u009b'
];

var END_CODE = 39;

var ESCAPE_CODES = {
	0: 0,
	1: 22,
	2: 22,
	3: 23,
	4: 24,
	7: 27,
	8: 28,
	9: 29,
	30: 39,
	31: 39,
	32: 39,
	33: 39,
	34: 39,
	35: 39,
	36: 39,
	37: 39,
	90: 39,
	40: 49,
	41: 49,
	42: 49,
	43: 49,
	44: 49,
	45: 49,
	46: 49,
	47: 49
};

function wrapAnsi(code) {
	return ESCAPES[0] + '[' + code + 'm';
}

module.exports = function (str, cols) {
	var pre = '';
	var ret = '';
	var insideEscape = false;
	var escapeCode;
	var visible = 0;
	var lastSpace = 0;

	for (var i = 0; i < str.length; i++) {
		var x = str[i];
		pre += x;

		if (ESCAPES.indexOf(x) !== -1) {
			insideEscape = true;
		} else if (insideEscape && x === 'm') {
			insideEscape = false;
			continue;
		}

		if (insideEscape) {
			continue;
		}

		if (x === ' ') {
			lastSpace = i;
		}

		if (++visible >= cols - 2 && lastSpace > 0) {
			pre = spliceString(pre, lastSpace, 1, '\n');
			lastSpace = 0;
			visible = 0;
		}
	}

	visible = 0;

	for (var j = 0; j < pre.length; j++) {
		var y = pre[j];

		ret += y;

		if (ESCAPES.indexOf(y) !== -1) {
			var code = parseFloat(/[0-9][^m]*/.exec(pre.slice(j, j + 4)));
			escapeCode = code === END_CODE ? null : code;
		} else if (insideEscape && y === 'm') {
			insideEscape = false;
			continue;
		}

		if (insideEscape) {
			continue;
		}

		visible++;

		if (escapeCode && ESCAPE_CODES[escapeCode]) {
			if (pre[j + 1] === '\n') {
				ret += wrapAnsi(ESCAPE_CODES[escapeCode]);
			} else if (y === '\n') {
				ret += wrapAnsi(escapeCode);
			}
		}
	}

	return ret;
};
