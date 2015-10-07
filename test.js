'use strict';
var test = require('ava');
var chalk = require('chalk');
var stripAnsi = require('strip-ansi');
var fn = require('./');

var fixture = 'The quick brown ' + chalk.red('fox jumped over ') + 'the lazy ' + chalk.green('dog and then ran away with the unicorn.');

test(function (t) {
	var res5 = fn(fixture, 5, {hard: true});
	var res20 = fn(fixture, 20);
	var res30 = fn(fixture, 30);

	t.assert(res20 === 'The quick brown \u001b[31mfox\u001b[39m\n\u001b[31mjumped over \u001b[39mthe lazy\n\u001b[32mdog and then ran\u001b[39m\n\u001b[32maway with the\u001b[39m\n\u001b[32municorn.\u001b[39m');
	t.assert(stripAnsi(res20).split('\n').every(function (x) {
		return x.length <= 20;
	}));

	t.assert(res30 === 'The quick brown \u001b[31mfox jumped\u001b[39m\n\u001b[31mover \u001b[39mthe lazy \u001b[32mdog and then ran\u001b[39m\n\u001b[32maway with the unicorn.\u001b[39m');
	t.assert(stripAnsi(res30).split('\n').every(function (x) {
		return x.length <= 30;
	}));

	// words greater than 5 characters, e.g., unicorn., will be split onto multiple lines.
	t.assert(res5 === 'The\nquick\nbrown\n\u001b[31mfox\u001b[39m\n\u001b[31mjumpe\u001b[39m\n\u001b[31md\u001b[39m\n\u001b[31mover\u001b[39m\n\u001b[31m\u001b[39mthe\nlazy\n\u001b[32mdog\u001b[39m\n\u001b[32mand\u001b[39m\n\u001b[32mthen\u001b[39m\n\u001b[32mran\u001b[39m\n\u001b[32maway\u001b[39m\n\u001b[32mwith\u001b[39m\n\u001b[32mthe\u001b[39m\n\u001b[32munico\u001b[39m\n\u001b[32mrn.\u001b[39m');
	t.assert(stripAnsi(res5).split('\n').every(function (x) {
		return x.length <= 5;
	}));

	t.end();
});
