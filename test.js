import test from 'ava';
import chalk from 'chalk';
import hasAnsi from 'has-ansi';
import stripAnsi from 'strip-ansi';
import fn from './';

// when "hard" is false

const fixture = 'The quick brown ' + chalk.red('fox jumped over ') + 'the lazy ' + chalk.green('dog and then ran away with the unicorn.');
const fixture2 = '12345678\n901234567890';

test('wraps string at 20 characters', t => {
	const res20 = fn(fixture, 20);

	t.is(res20, 'The quick brown \u001b[31mfox\u001b[39m\n\u001b[31mjumped over \u001b[39mthe lazy\n\u001b[32mdog and then ran\u001b[39m\n\u001b[32maway with the\u001b[39m\n\u001b[32municorn.\u001b[39m');
	t.true(stripAnsi(res20).split('\n').every(x => x.length <= 20));
});

test('wraps string at 30 characters', t => {
	const res30 = fn(fixture, 30);

	t.is(res30, 'The quick brown \u001b[31mfox jumped\u001b[39m\n\u001b[31mover \u001b[39mthe lazy \u001b[32mdog and then ran\u001b[39m\n\u001b[32maway with the unicorn.\u001b[39m');
	t.true(stripAnsi(res30).split('\n').every(function (x) {
		return x.length <= 30;
	}));
});

test('does not break strings longer than "cols" characters', t => {
	const res5 = fn(fixture, 5, {hard: false});

	t.is(res5, 'The\nquick\nbrown\n\u001b[31mfox\u001b[39m\n\u001b[31mjumped\u001b[39m\n\u001b[31mover\u001b[39m\n\u001b[31m\u001b[39mthe\nlazy\n\u001b[32mdog\u001b[39m\n\u001b[32mand\u001b[39m\n\u001b[32mthen\u001b[39m\n\u001b[32mran\u001b[39m\n\u001b[32maway\u001b[39m\n\u001b[32mwith\u001b[39m\n\u001b[32mthe\u001b[39m\n\u001b[32municorn.\u001b[39m');
	t.true(stripAnsi(res5).split('\n').filter(x => x.length > 5).length > 0);
});

test('handles colored string that wraps on to multiple lines', t => {
	const res = fn(chalk.green('hello world') + ' hey!', 5, {hard: false});
	const lines = res.split('\n');
	t.true(hasAnsi(lines[0]));
	t.true(hasAnsi(lines[1]));
	t.false(hasAnsi(lines[2]));
});

test('does not prepend newline if first string is greater than "cols"', t => {
	const res = fn(chalk.green('hello') + '-world', 5, {hard: false});
	t.is(res.split('\n').length, 1);
});

// when "hard" is true

test('breaks strings longer than "cols" characters', t => {
	const res5 = fn(fixture, 5, {hard: true});

	t.is(res5, 'The\nquick\nbrown\n\u001b[31mfox\u001b[39m\n\u001b[31mjumpe\u001b[39m\n\u001b[31md\u001b[39m\n\u001b[31mover\u001b[39m\n\u001b[31m\u001b[39mthe\nlazy\n\u001b[32mdog\u001b[39m\n\u001b[32mand\u001b[39m\n\u001b[32mthen\u001b[39m\n\u001b[32mran\u001b[39m\n\u001b[32maway\u001b[39m\n\u001b[32mwith\u001b[39m\n\u001b[32mthe\u001b[39m\n\u001b[32munico\u001b[39m\n\u001b[32mrn.\u001b[39m');
	t.true(stripAnsi(res5).split('\n').every(x => x.length <= 5));
});

test('removes last row if it contained only ansi escape codes', t => {
	const res = fn(chalk.green('helloworld'), 2, {hard: true});
	t.true(stripAnsi(res).split('\n').every(x => x.length === 2));
});

test('does not prepend newline if first word is split', t => {
	const res = fn(chalk.green('hello') + 'world', 5, {hard: true});
	t.is(res.split('\n').length, 2);
});

test('takes into account line returns inside input', t => {
	const res20 = fn(fixture2, 10, {hard: true});
	t.is(res20, '12345678\n9012345678\n90');
});
