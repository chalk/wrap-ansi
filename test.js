'use strict';
var test = require('ava');
var chalk = require('chalk');
var stripAnsi = require('strip-ansi');
var fn = require('./');

var fixture = 'The quick brown ' + chalk.red('fox jumped over ') + 'the lazy ' + chalk.green('dog and then ran away with the unicorn.');

test(function (t) {
	var res5 = fn.hard(fixture, 5);
	var res20 = fn(fixture, 20);
	var res30 = fn(fixture, 30);

	t.assert(res20 === 'The quick brown \x1B[31mfox\x1B[39m\n\x1B[31mjumped over \x1B[39mthe lazy\n\x1B[32mdog and then ran\x1B[39m\n\x1B[32maway with the\x1B[39m\n\x1B[32municorn.\x1B[39m');
	t.assert(stripAnsi(res20).split('\n').every(function (x) {
		return x.length <= 20;
	}));

	t.assert(res30 === 'The quick brown \x1B[31mfox jumped\x1B[39m\n\x1B[31mover \x1B[39mthe lazy \x1B[32mdog and then ran\x1B[39m\n\x1B[32maway with the unicorn.\x1B[39m');
	t.assert(stripAnsi(res30).split('\n').every(function (x) {
		return x.length <= 30;
	}));

	// words greate than 5 characters, e.g., unicorn., will be split onto multiple lines.
	t.assert(res5 === 'The\nquick\nbrown\n\x1B[31mfox\x1B[39m\n\x1B[31mjumpe\x1B[39m\n\x1B[31md\x1B[39m\n\x1B[31mover\x1B[39m\n\x1B[31m\x1B[39mthe\nlazy\n\x1B[32mdog\x1B[39m\n\x1B[32mand\x1B[39m\n\x1B[32mthen\x1B[39m\n\x1B[32mran\x1B[39m\n\x1B[32maway\x1B[39m\n\x1B[32mwith\x1B[39m\n\x1B[32mthe\x1B[39m\n\x1B[32munico\x1B[39m\n\x1B[32mrn.\x1B[39m');
	t.assert(stripAnsi(res5).split('\n').every(function (x) {
		return x.length <= 5;
	}));

	t.end();
});
