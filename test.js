'use strict';
var test = require('ava');
var chalk = require('chalk');
var hasAnsi = require('has-ansi');
var stripAnsi = require('strip-ansi');
var fn = require('./');

// when "hard" is false

var fixture = 'The quick brown ' + chalk.red('fox jumped over ') + 'the lazy ' + chalk.green('dog and then ran away with the unicorn.');

test('wraps string at 20 characters', function (t) {
	var res20 = fn(fixture, 20);

	t.assert(res20 === 'The quick brown \u001b[31mfox\u001b[39m\n\u001b[31mjumped over \u001b[39mthe lazy\n\u001b[32mdog and then ran\u001b[39m\n\u001b[32maway with the\u001b[39m\n\u001b[32municorn.\u001b[39m');
	t.assert(stripAnsi(res20).split('\n').every(function (x) {
		return x.length <= 20;
	}));

	t.end();
});

test('wraps string at 30 characters', function (t) {
	var res30 = fn(fixture, 30);

	t.assert(res30 === 'The quick brown \u001b[31mfox jumped\u001b[39m\n\u001b[31mover \u001b[39mthe lazy \u001b[32mdog and then ran\u001b[39m\n\u001b[32maway with the unicorn.\u001b[39m');
	t.assert(stripAnsi(res30).split('\n').every(function (x) {
		return x.length <= 30;
	}));

	t.end();
});

test('does not break strings longer than "cols" characters', function (t) {
	var res5 = fn(fixture, 5, {hard: false});

	t.assert(res5 === 'The\nquick\nbrown\n\u001b[31mfox\u001b[39m\n\u001b[31mjumped\u001b[39m\n\u001b[31mover\u001b[39m\n\u001b[31m\u001b[39mthe\nlazy\n\u001b[32mdog\u001b[39m\n\u001b[32mand\u001b[39m\n\u001b[32mthen\u001b[39m\n\u001b[32mran\u001b[39m\n\u001b[32maway\u001b[39m\n\u001b[32mwith\u001b[39m\n\u001b[32mthe\u001b[39m\n\u001b[32municorn.\u001b[39m');
	t.assert(
		stripAnsi(res5).split('\n').filter(function (x) {
			return x.length > 5;
		}).length > 0
	);

	t.end();
});

test('handles colored string that wraps on to multiple lines', function (t) {
	var res = fn(chalk.green('hello world') + ' hey!', 5, {hard: false});
	var lines = res.split('\n');
	t.assert(hasAnsi(lines[0]));
	t.assert(hasAnsi(lines[1]));
	t.assert(hasAnsi(lines[2]) === false);
	t.end();
});

test('does not prepend newline if first string is greater than "cols"', function (t) {
	var res = fn(chalk.green('hello') + '-world', 5, {hard: false});
	t.assert(res.split('\n').length === 1);
	t.end();
});

// when "hard" is true

test('breaks strings longer than "cols" characters', function (t) {
	var res5 = fn(fixture, 5, {hard: true});

	t.assert(res5 === 'The\nquick\nbrown\n\u001b[31mfox\u001b[39m\n\u001b[31mjumpe\u001b[39m\n\u001b[31md\u001b[39m\n\u001b[31mover\u001b[39m\n\u001b[31m\u001b[39mthe\nlazy\n\u001b[32mdog\u001b[39m\n\u001b[32mand\u001b[39m\n\u001b[32mthen\u001b[39m\n\u001b[32mran\u001b[39m\n\u001b[32maway\u001b[39m\n\u001b[32mwith\u001b[39m\n\u001b[32mthe\u001b[39m\n\u001b[32munico\u001b[39m\n\u001b[32mrn.\u001b[39m');
	t.assert(stripAnsi(res5).split('\n').every(function (x) {
		return x.length <= 5;
	}));

	t.end();
});

test('removes last row if it contained only ansi escape codes', function (t) {
	var res = fn(chalk.green('helloworld'), 2, {hard: true});

	t.assert(stripAnsi(res).split('\n').every(function (x) {
		return x.length === 2;
	}));

	t.end();
});

test('does not prepend newline if first word is split', function (t) {
	var res = fn(chalk.green('hello') + 'world', 5, {hard: true});
	t.assert(res.split('\n').length === 2);
	t.end();
});
