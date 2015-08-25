'use strict';
var spliceString = require('splice-string');

module.exports = function (str, cols) {
	var pre = '';
	var ret = '';
	var insideEscape = false;
	var endCode = '\u001b[39m';
	var escapeCode;
	var visible = 0;
	var lastSpace = 0;

	for (var i = 0; i < str.length; i++) {
		var x = str[i];
		pre += x;

		if (x === '\u001b') {
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
		if (y === '\u001b') {
			var code = parseFloat(pre.slice(j, j + 4).match(/[0-9][^m]*/));
			escapeCode = (code === 39) ? undefined : code;
		} else if (insideEscape && y === 'm') {
			insideEscape = false;
			continue;
		}

		if (insideEscape) {
			continue;
		}

		++visible;
		if (escapeCode) {
			if (pre[j + 1] === '\n') {
				ret += endCode;
			} else if (y === '\n') {
				ret += '\u001b[' + escapeCode + 'm';
			}
		}
	}

	return ret;
};
