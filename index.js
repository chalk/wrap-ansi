'use strict';
var spliceString = require('splice-string');

module.exports = function (str, cols) {
	var ret = '';
	var insideEscape = false;
	var visible = 0;
	var lastSpace = 0;

	for (var i = 0; i < str.length; i++) {
		var x = str[i];

		ret += x;

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
			ret = spliceString(ret, lastSpace, 1, '\n');
			lastSpace = 0;
			visible = 0;
		}
	}

	return ret;
};
