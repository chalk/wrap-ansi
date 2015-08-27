'use strict';
var test = require('ava');
var chalk = require('chalk');
var stripAnsi = require('strip-ansi');
var fn = require('./');

var fixture = 'The quick brown ' + chalk.red('fox jumped over ') + 'the lazy ' + chalk.green('dog and then ran away with the unicorn.');

test(function (t) {
	var res20 = fn(fixture, 20);
	var res30 = fn(fixture, 30);

	t.assert(res20 === 'The quick brown\n\u001b[31mfox jumped over \u001b[39mthe\nlazy \u001b[32mdog and then\u001b[39m\n\u001b[32mran away with the\u001b[39m\n\u001b[32municorn.\u001b[39m');
	t.assert(stripAnsi(res20).split('\n').every(function (x) {
		return x.length <= 20;
	}));

	t.assert(res30 === 'The quick brown \u001b[31mfox jumped\u001b[39m\n\u001b[31mover \u001b[39mthe lazy \u001b[32mdog and then\u001b[39m\n\u001b[32mran away with the unicorn.\u001b[39m');
	t.assert(stripAnsi(res30).split('\n').every(function (x) {
		return x.length <= 30;
	}));

	t.end();
});
