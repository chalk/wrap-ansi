'use strict';
var test = require('ava');
var chalk = require('chalk');
var stripAnsi = require('strip-ansi');
var fn = require('./');

var fixture = 'The quick brown ' + chalk.red('fox jumped over ') + 'the lazy ' + chalk.green('dog and then ran away with the unicorn.');

test(function (t) {
	var res = fn(fixture, 20);

	console.log(fn(fixture, 20) + '\n');

	t.assert(res === 'The quick brown\n\u001b[31mfox jumped over \u001b[39mthe\nlazy \u001b[32mdog and then\nran away with the\nunicorn.\u001b[39m');
	t.assert(stripAnsi(res).split('\n').every(function (x) {
		return x.length <= 20;
	}));

	t.end();
});
