import test from 'ava';
import chalk from 'chalk';
import hasAnsi from 'has-ansi';
import stripAnsi from 'strip-ansi';
import wrapAnsi from '.';

chalk.enabled = true;

// When "hard" is false

const fixture = 'The quick brown ' + chalk.red('fox jumped over ') + 'the lazy ' + chalk.green('dog and then ran away with the unicorn.');
const fixture2 = '12345678\n901234567890';
const fixture3 = '12345678\n901234567890 12345';
const fixture4 = '12345678\n';
const fixture5 = '12345678\n ';

test('wraps string at 20 characters', t => {
	const result = wrapAnsi(fixture, 20);

	t.is(result, 'The quick brown \u001B[31mfox\u001B[39m\n\u001B[31mjumped over \u001B[39mthe lazy\n\u001B[32mdog and then ran\u001B[39m\n\u001B[32maway with the\u001B[39m\n\u001B[32municorn.\u001B[39m');
	t.true(stripAnsi(result).split('\n').every(line => line.length <= 20));
});

test('wraps string at 30 characters', t => {
	const result = wrapAnsi(fixture, 30);

	t.is(result, 'The quick brown \u001B[31mfox jumped\u001B[39m\n\u001B[31mover \u001B[39mthe lazy \u001B[32mdog and then ran\u001B[39m\n\u001B[32maway with the unicorn.\u001B[39m');
	t.true(stripAnsi(result).split('\n').every(line => line.length <= 30));
});

test('does not break strings longer than "cols" characters', t => {
	const result = wrapAnsi(fixture, 5, {hard: false});

	t.is(result, 'The\nquick\nbrown\n\u001B[31mfox\u001B[39m\n\u001B[31mjumped\u001B[39m\n\u001B[31mover\u001B[39m\n\u001B[31m\u001B[39mthe\nlazy\n\u001B[32mdog\u001B[39m\n\u001B[32mand\u001B[39m\n\u001B[32mthen\u001B[39m\n\u001B[32mran\u001B[39m\n\u001B[32maway\u001B[39m\n\u001B[32mwith\u001B[39m\n\u001B[32mthe\u001B[39m\n\u001B[32municorn.\u001B[39m');
	t.true(stripAnsi(result).split('\n').filter(line => line.length > 5).length > 0);
});

test('handles colored string that wraps on to multiple lines', t => {
	const result = wrapAnsi(chalk.green('hello world') + ' hey!', 5, {hard: false});
	const lines = result.split('\n');
	t.true(hasAnsi(lines[0]));
	t.true(hasAnsi(lines[1]));
	t.false(hasAnsi(lines[2]));
});

test('does not prepend newline if first string is greater than "cols"', t => {
	const result = wrapAnsi(chalk.green('hello') + '-world', 5, {hard: false});
	t.is(result.split('\n').length, 1);
});

// When "hard" is true

test('breaks strings longer than "cols" characters', t => {
	const result = wrapAnsi(fixture, 5, {hard: true});

	t.is(result, 'The\nquick\nbrown\n\u001B[31mfox j\u001B[39m\n\u001B[31mumped\u001B[39m\n\u001B[31mover\u001B[39m\n\u001B[31m\u001B[39mthe\nlazy\n\u001B[32mdog\u001B[39m\n\u001B[32mand\u001B[39m\n\u001B[32mthen\u001B[39m\n\u001B[32mran\u001B[39m\n\u001B[32maway\u001B[39m\n\u001B[32mwith\u001B[39m\n\u001B[32mthe\u001B[39m\n\u001B[32munico\u001B[39m\n\u001B[32mrn.\u001B[39m');
	t.true(stripAnsi(result).split('\n').every(line => line.length <= 5));
});

test('removes last row if it contained only ansi escape codes', t => {
	const result = wrapAnsi(chalk.green('helloworld'), 2, {hard: true});
	t.true(stripAnsi(result).split('\n').every(x => x.length === 2));
});

test('does not prepend newline if first word is split', t => {
	const result = wrapAnsi(chalk.green('hello') + 'world', 5, {hard: true});
	t.is(result.split('\n').length, 2);
});

test('takes into account line returns inside input', t => {
	t.is(wrapAnsi(fixture2, 10, {hard: true}), '12345678\n9012345678\n90');
});

test('word wrapping', t => {
	t.is(wrapAnsi(fixture3, 15), '12345678\n901234567890\n12345');
});

test('no word-wrapping', t => {
	const result = wrapAnsi(fixture3, 15, {wordWrap: false});
	t.is(result, '12345678\n901234567890 12\n345');

	const result2 = wrapAnsi(fixture3, 5, {wordWrap: false});
	t.is(result2, '12345\n678\n90123\n45678\n90 12\n345');

	const rsult3 = wrapAnsi(fixture5, 5, {wordWrap: false});
	t.is(rsult3, '12345\n678\n');

	const result4 = wrapAnsi(fixture, 5, {wordWrap: false});
	t.is(result4, 'The q\nuick\nbrown\n\u001B[31mfox j\u001B[39m\n\u001B[31mumped\u001B[39m\n\u001B[31mover\u001B[39m\n\u001B[31m\u001B[39mthe l\nazy \u001B[32md\u001B[39m\n\u001B[32mog an\u001B[39m\n\u001B[32md the\u001B[39m\n\u001B[32mn ran\u001B[39m\n\u001B[32maway\u001B[39m\n\u001B[32mwith\u001B[39m\n\u001B[32mthe u\u001B[39m\n\u001B[32mnicor\u001B[39m\n\u001B[32mn.\u001B[39m');
});

test('no word-wrapping and no trimming', t => {
	const result = wrapAnsi(fixture3, 13, {wordWrap: false, trim: false});
	t.is(result, '12345678\n901234567890 \n12345');

	const result2 = wrapAnsi(fixture4, 5, {wordWrap: false, trim: false});
	t.is(result2, '12345\n678\n');

	const result3 = wrapAnsi(fixture5, 5, {wordWrap: false, trim: false});
	t.is(result3, '12345\n678\n ');

	const result4 = wrapAnsi(fixture, 5, {wordWrap: false, trim: false});
	t.is(result4, 'The q\nuick \nbrown\n \u001B[31mfox \u001B[39m\n[31mjumpe[39m\n[31md ove[39m\n[31mr \u001B[39mthe\n lazy\n \u001B[32mdog \u001B[39m\n[32mand t[39m\n[32mhen r[39m\n[32man aw[39m\n[32may wi[39m\n[32mth th[39m\n[32me uni[39m\n[32mcorn.\u001B[39m');
});

test('supports fullwidth characters', t => {
	t.is(wrapAnsi('안녕하세', 4, {hard: true}), '안녕\n하세');
});

test('supports unicode surrogate pairs', t => {
	t.is(wrapAnsi('a\uD83C\uDE00bc', 2, {hard: true}), 'a\n\uD83C\uDE00\nbc');
	t.is(wrapAnsi('a\uD83C\uDE00bc\uD83C\uDE00d\uD83C\uDE00', 2, {hard: true}), 'a\n\uD83C\uDE00\nbc\n\uD83C\uDE00\nd\n\uD83C\uDE00');
});

test('#23, properly wraps whitespace with no trimming', t => {
	t.is(wrapAnsi('   ', 2, {trim: false}), '  \n ');
	t.is(wrapAnsi('   ', 2, {trim: false, hard: true}), '  \n ');
});

test('#24, trims leading and trailing whitespace only on actual wrapped lines and only with trimming', t => {
	t.is(wrapAnsi('   foo   bar   ', 3), 'foo\nbar');
	t.is(wrapAnsi('   foo   bar   ', 6), 'foo\nbar');
	t.is(wrapAnsi('   foo   bar   ', 42), 'foo   bar');
	t.is(wrapAnsi('   foo   bar   ', 42, {trim: false}), '   foo   bar   ');
});

test('#24, trims leading and trailing whitespace inside a color block only on actual wrapped lines and only with trimming', t => {
	t.is(wrapAnsi(chalk.blue('   foo   bar   '), 6), chalk.blue('foo\nbar'));
	t.is(wrapAnsi(chalk.blue('   foo   bar   '), 42), chalk.blue('foo   bar'));
	t.is(wrapAnsi(chalk.blue('   foo   bar   '), 42, {trim: false}), chalk.blue('   foo   bar   '));
});

test('#25, properly wraps whitespace between words with no trimming', t => {
	t.is(wrapAnsi('foo bar', 3), 'foo\nbar');
	t.is(wrapAnsi('foo bar', 3, {hard: true}), 'foo\nbar');
	t.is(wrapAnsi('foo bar', 3, {trim: false}), 'foo\n \nbar');
	t.is(wrapAnsi('foo bar', 3, {trim: false, hard: true}), 'foo\n \nbar');
});

test('#26, does not multiplicate leading spaces with no trimming', t => {
	t.is(wrapAnsi(' a ', 10, {trim: false}), ' a ');
	t.is(wrapAnsi('   a ', 10, {trim: false}), '   a ');
});

test('#27, does not remove spaces in line with ansi escapes when no trimming', t => {
	t.is(wrapAnsi(chalk.bgGreen(` ${chalk.black('OK')} `), 100, {trim: false}), chalk.bgGreen(` ${chalk.black('OK')} `));
	t.is(wrapAnsi(chalk.bgGreen(`  ${chalk.black('OK')} `), 100, {trim: false}), chalk.bgGreen(`  ${chalk.black('OK')} `));
	t.is(wrapAnsi(chalk.bgGreen(' hello '), 10, {hard: true, trim: false}), chalk.bgGreen(' hello '));
});
