import test from 'ava';
import chalk from 'chalk';
import hasAnsi from 'has-ansi';
import stripAnsi from 'strip-ansi';
import m from '.';

chalk.enabled = true;

// When "hard" is false

const fixture = 'The quick brown ' + chalk.red('fox jumped over ') + 'the lazy ' + chalk.green('dog and then ran away with the unicorn.');
const fixture2 = '12345678\n901234567890';
const fixture3 = '12345678\n901234567890 12345';
const fixture4 = '12345678\n';
const fixture5 = '12345678\n ';

test('wraps string at 20 characters', t => {
	const res20 = m(fixture, 20);

	t.is(res20, 'The quick brown \u001B[31mfox\u001B[39m\n\u001B[31mjumped over \u001B[39mthe lazy\n\u001B[32mdog and then ran\u001B[39m\n\u001B[32maway with the\u001B[39m\n\u001B[32municorn.\u001B[39m');
	t.true(stripAnsi(res20).split('\n').every(x => x.length <= 20));
});

test('wraps string at 30 characters', t => {
	const res30 = m(fixture, 30);

	t.is(res30, 'The quick brown \u001B[31mfox jumped\u001B[39m\n\u001B[31mover \u001B[39mthe lazy \u001B[32mdog and then ran\u001B[39m\n\u001B[32maway with the unicorn.\u001B[39m');
	t.true(stripAnsi(res30).split('\n').every(x => x.length <= 30));
});

test('does not break strings longer than "cols" characters', t => {
	const res5 = m(fixture, 5, {hard: false});

	t.is(res5, 'The\nquick\nbrown\n\u001B[31mfox\u001B[39m\n\u001B[31mjumped\u001B[39m\n\u001B[31mover\u001B[39m\n\u001B[31m\u001B[39mthe\nlazy\n\u001B[32mdog\u001B[39m\n\u001B[32mand\u001B[39m\n\u001B[32mthen\u001B[39m\n\u001B[32mran\u001B[39m\n\u001B[32maway\u001B[39m\n\u001B[32mwith\u001B[39m\n\u001B[32mthe\u001B[39m\n\u001B[32municorn.\u001B[39m');
	t.true(stripAnsi(res5).split('\n').filter(x => x.length > 5).length > 0);
});

test('handles colored string that wraps on to multiple lines', t => {
	const res = m(chalk.green('hello world') + ' hey!', 5, {hard: false});
	const lines = res.split('\n');
	t.true(hasAnsi(lines[0]));
	t.true(hasAnsi(lines[1]));
	t.false(hasAnsi(lines[2]));
});

test('does not prepend newline if first string is greater than "cols"', t => {
	const res = m(chalk.green('hello') + '-world', 5, {hard: false});
	t.is(res.split('\n').length, 1);
});

// When "hard" is true

test('breaks strings longer than "cols" characters', t => {
	const res5 = m(fixture, 5, {hard: true});

	t.is(res5, 'The\nquick\nbrown\n\u001B[31mfox\u001B[39m\n\u001B[31mjumpe\u001B[39m\n\u001B[31md\u001B[39m\n\u001B[31mover\u001B[39m\n\u001B[31m\u001B[39mthe\nlazy\n\u001B[32mdog\u001B[39m\n\u001B[32mand\u001B[39m\n\u001B[32mthen\u001B[39m\n\u001B[32mran\u001B[39m\n\u001B[32maway\u001B[39m\n\u001B[32mwith\u001B[39m\n\u001B[32mthe\u001B[39m\n\u001B[32munico\u001B[39m\n\u001B[32mrn.\u001B[39m');
	t.true(stripAnsi(res5).split('\n').every(x => x.length <= 5));
});

test('removes last row if it contained only ansi escape codes', t => {
	const res = m(chalk.green('helloworld'), 2, {hard: true});
	t.true(stripAnsi(res).split('\n').every(x => x.length === 2));
});

test('does not prepend newline if first word is split', t => {
	const res = m(chalk.green('hello') + 'world', 5, {hard: true});
	t.is(res.split('\n').length, 2);
});

test('takes into account line returns inside input', t => {
	const res20 = m(fixture2, 10, {hard: true});
	t.is(res20, '12345678\n9012345678\n90');
});

test('word wrapping', t => {
	const res = m(fixture3, 15);
	t.is(res, '12345678\n901234567890\n12345');
});

test('no word-wrapping', t => {
	const res = m(fixture3, 15, {wordWrap: false});
	t.is(res, '12345678\n901234567890 12\n345');

	const res2 = m(fixture3, 5, {wordWrap: false});
	t.is(res2, '12345\n678\n90123\n45678\n90 12\n345');

	const res3 = m(fixture5, 5, {wordWrap: false});
	t.is(res3, '12345\n678\n');

	const res4 = m(fixture, 5, {wordWrap: false});
	t.is(res4, 'The q\nuick\nbrown\n\u001B[31mfox j\u001B[39m\n\u001B[31mumped\u001B[39m\n\u001B[31mover\u001B[39m\n\u001B[31m\u001B[39mthe l\nazy \u001B[32md\u001B[39m\n\u001B[32mog an\u001B[39m\n\u001B[32md the\u001B[39m\n\u001B[32mn ran\u001B[39m\n\u001B[32maway\u001B[39m\n\u001B[32mwith\u001B[39m\n\u001B[32mthe u\u001B[39m\n\u001B[32mnicor\u001B[39m\n\u001B[32mn.\u001B[39m');
});

test('no word-wrapping and no trimming', t => {
	const res = m(fixture3, 13, {wordWrap: false, trim: false});
	t.is(res, '12345678\n901234567890 \n12345');

	const res2 = m(fixture4, 5, {wordWrap: false, trim: false});
	t.is(res2, '12345\n678\n');

	const res3 = m(fixture5, 5, {wordWrap: false, trim: false});
	t.is(res3, '12345\n678\n ');

	const res4 = m(fixture, 5, {wordWrap: false, trim: false});
	t.is(res4, 'The q\nuick \nbrown\n \u001B[31mfox \u001B[39m\n[31mjumpe[39m\n[31md ove[39m\n[31mr \u001B[39mthe\n lazy\n \u001B[32mdog \u001B[39m\n[32mand t[39m\n[32mhen r[39m\n[32man aw[39m\n[32may wi[39m\n[32mth th[39m\n[32me uni[39m\n[32mcorn.\u001B[39m');
});

test('supports fullwidth characters', t => {
	t.is(m('안녕하세', 4, {hard: true}), '안녕\n하세');
});

test('supports unicode surrogate pairs', t => {
	t.is(m('a\uD83C\uDE00bc', 2, {hard: true}), 'a\n\uD83C\uDE00\nbc');
	t.is(m('a\uD83C\uDE00bc\uD83C\uDE00d\uD83C\uDE00', 2, {hard: true}), 'a\n\uD83C\uDE00\nbc\n\uD83C\uDE00\nd\n\uD83C\uDE00');
});
