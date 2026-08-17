import test from 'node:test';
import assert from 'node:assert/strict';
import chalk from 'chalk';
import hasAnsi from 'has-ansi';
import stripAnsi from 'strip-ansi';
import wrapAnsi from './index.js';

chalk.level = 1;

// When "hard" is false

const fixture = 'The quick brown ' + chalk.red('fox jumped over ') + 'the lazy ' + chalk.green('dog and then ran away with the unicorn.');
const fixture2 = '12345678\n901234567890';
const fixture3 = '12345678\n901234567890 12345';
const fixture4 = '12345678\n';
const fixture5 = '12345678\n ';

test('wraps string at 20 characters', () => {
	const result = wrapAnsi(fixture, 20);

	assert.equal(result, 'The quick brown \u001B[31mfox\u001B[39m\n\u001B[31mjumped over \u001B[39mthe lazy\n\u001B[32mdog and then ran\u001B[39m\n\u001B[32maway with the\u001B[39m\n\u001B[32municorn.\u001B[39m');
	assert.ok(stripAnsi(result).split('\n').every(line => line.length <= 20));
});

test('wraps string at 30 characters', () => {
	const result = wrapAnsi(fixture, 30);

	assert.equal(result, 'The quick brown \u001B[31mfox jumped\u001B[39m\n\u001B[31mover \u001B[39mthe lazy \u001B[32mdog and then ran\u001B[39m\n\u001B[32maway with the unicorn.\u001B[39m');
	assert.ok(stripAnsi(result).split('\n').every(line => line.length <= 30));
});

test('does not break strings longer than "cols" characters', () => {
	const result = wrapAnsi(fixture, 5, {hard: false});

	assert.equal(result, 'The\nquick\nbrown\n\u001B[31mfox\u001B[39m\n\u001B[31mjumped\u001B[39m\n\u001B[31mover\u001B[39m\n\u001B[39mthe\nlazy\n\u001B[32mdog\u001B[39m\n\u001B[32mand\u001B[39m\n\u001B[32mthen\u001B[39m\n\u001B[32mran\u001B[39m\n\u001B[32maway\u001B[39m\n\u001B[32mwith\u001B[39m\n\u001B[32mthe\u001B[39m\n\u001B[32municorn.\u001B[39m');
	assert.ok(stripAnsi(result).split('\n').some(line => line.length > 5));
});

test('handles colored string that wraps on to multiple lines', () => {
	const result = wrapAnsi(chalk.green('hello world') + ' hey!', 5, {hard: false});
	const lines = result.split('\n');
	assert.ok(hasAnsi(lines[0]));
	assert.ok(hasAnsi(lines[1]));
	assert.ok(!hasAnsi(lines[2]));
});

test('does not prepend newline if first string is greater than "cols"', () => {
	const result = wrapAnsi(chalk.green('hello') + '-world', 5, {hard: false});
	assert.equal(result.split('\n').length, 1);
});

// When "hard" is true

test('breaks strings longer than "cols" characters', () => {
	const result = wrapAnsi(fixture, 5, {hard: true});

	assert.equal(result, 'The\nquick\nbrown\n\u001B[31mfox j\u001B[39m\n\u001B[31mumped\u001B[39m\n\u001B[31mover\u001B[39m\n\u001B[39mthe\nlazy\n\u001B[32mdog\u001B[39m\n\u001B[32mand\u001B[39m\n\u001B[32mthen\u001B[39m\n\u001B[32mran\u001B[39m\n\u001B[32maway\u001B[39m\n\u001B[32mwith\u001B[39m\n\u001B[32mthe\u001B[39m\n\u001B[32munico\u001B[39m\n\u001B[32mrn.\u001B[39m');
	assert.ok(stripAnsi(result).split('\n').every(line => line.length <= 5));
});

test('removes last row if it contained only ansi escape codes', () => {
	const result = wrapAnsi(chalk.green('helloworld'), 2, {hard: true});
	assert.ok(stripAnsi(result).split('\n').every(x => x.length === 2));
});

test('does not prepend newline if first word is split', () => {
	const result = wrapAnsi(chalk.green('hello') + 'world', 5, {hard: true});
	assert.equal(result.split('\n').length, 2);
});

test('takes into account line returns inside input', () => {
	assert.equal(wrapAnsi(fixture2, 10, {hard: true}), '12345678\n9012345678\n90');
});

test('word wrapping', () => {
	assert.equal(wrapAnsi(fixture3, 15), '12345678\n901234567890\n12345');
});

test('does not pre-wrap long words when hard wrapping with wordWrap false', () => {
	const defaultResult = wrapAnsi('hi, this https://IsAReallyLongWordButIDoNotKnowHowItShouldBehave.com', 32, {hard: true});
	assert.equal(defaultResult, 'hi, this\nhttps://IsAReallyLongWordButIDoN\notKnowHowItShouldBehave.com');

	const result = wrapAnsi('hi, this https://IsAReallyLongWordButIDoNotKnowHowItShouldBehave.com', 32, {hard: true, wordWrap: false});
	assert.equal(result, 'hi, this https://IsAReallyLongWo\nrdButIDoNotKnowHowItShouldBehave\n.com');

	const result2 = wrapAnsi('hi, this IsAReallyLongWordButIDoNotKnowHowItShouldBehave', 32, {hard: true, wordWrap: false});
	assert.equal(result2, 'hi, this IsAReallyLongWordButIDo\nNotKnowHowItShouldBehave');
});

test('no word-wrapping', () => {
	const result = wrapAnsi(fixture3, 15, {wordWrap: false});
	assert.equal(result, '12345678\n901234567890 12\n345');

	const result2 = wrapAnsi(fixture3, 5, {wordWrap: false});
	assert.equal(result2, '12345\n678\n90123\n45678\n90 12\n345');

	const result3 = wrapAnsi(fixture5, 5, {wordWrap: false});
	assert.equal(result3, '12345\n678\n');

	const result4 = wrapAnsi(fixture, 5, {wordWrap: false});
	assert.equal(result4, 'The q\nuick\nbrown\n\u001B[31mfox j\u001B[39m\n\u001B[31mumped\u001B[39m\n\u001B[31mover\u001B[39m\n\u001B[39mthe l\nazy \u001B[32md\u001B[39m\n\u001B[32mog an\u001B[39m\n\u001B[32md the\u001B[39m\n\u001B[32mn ran\u001B[39m\n\u001B[32maway\u001B[39m\n\u001B[32mwith\u001B[39m\n\u001B[32mthe u\u001B[39m\n\u001B[32mnicor\u001B[39m\n\u001B[32mn.\u001B[39m');
});

test('no word-wrapping and no trimming', () => {
	const result = wrapAnsi(fixture3, 13, {wordWrap: false, trim: false});
	assert.equal(result, '12345678\n901234567890 \n12345');

	const result2 = wrapAnsi(fixture4, 5, {wordWrap: false, trim: false});
	assert.equal(result2, '12345\n678\n');

	const result3 = wrapAnsi(fixture5, 5, {wordWrap: false, trim: false});
	assert.equal(result3, '12345\n678\n ');

	const result4 = wrapAnsi(fixture, 5, {wordWrap: false, trim: false});
	assert.equal(result4, 'The q\nuick \nbrown\n \u001B[31mfox \u001B[39m\n\u001B[31mjumpe\u001B[39m\n\u001B[31md ove\u001B[39m\n\u001B[31mr \u001B[39mthe\n lazy\n \u001B[32mdog \u001B[39m\n\u001B[32mand t\u001B[39m\n\u001B[32mhen r\u001B[39m\n\u001B[32man aw\u001B[39m\n\u001B[32may wi\u001B[39m\n\u001B[32mth th\u001B[39m\n\u001B[32me uni\u001B[39m\n\u001B[32mcorn.\u001B[39m');
});

test('supports fullwidth characters', () => {
	assert.equal(wrapAnsi('안녕하세', 4, {hard: true}), '안녕\n하세');
});

test('supports unicode surrogate pairs', () => {
	assert.equal(wrapAnsi('a\uD83C\uDE00bc', 2, {hard: true}), 'a\n\uD83C\uDE00\nbc');
	assert.equal(wrapAnsi('a\uD83C\uDE00bc\uD83C\uDE00d\uD83C\uDE00', 2, {hard: true}), 'a\n\uD83C\uDE00\nbc\n\uD83C\uDE00\nd\n\uD83C\uDE00');
});

test('does not split multi-codepoint grapheme clusters across lines', () => {
	// ZWJ family emoji (7 codepoints, width 2)
	assert.equal(wrapAnsi('a👨‍👩‍👧‍👦b', 2, {hard: true}), 'a\n👨‍👩‍👧‍👦\nb');

	// Flag emoji (2 regional indicators, width 2)
	assert.equal(wrapAnsi('a🇺🇸b', 2, {hard: true}), 'a\n🇺🇸\nb');

	// Skin tone modifier (2 codepoints, width 2)
	assert.equal(wrapAnsi('a👋🏽b', 2, {hard: true}), 'a\n👋🏽\nb');

	// Tamil combining character (2 codepoints, width 2)
	assert.equal(wrapAnsi('நிநி', 1, {hard: true}), 'நி\nநி');

	// Multiple grapheme clusters fitting on one line
	assert.equal(wrapAnsi('🇺🇸🇬🇧', 4, {hard: true}), '🇺🇸🇬🇧');
	assert.equal(wrapAnsi('🇺🇸🇬🇧', 3, {hard: true}), '🇺🇸\n🇬🇧');

	// Grapheme cluster at exact column boundary
	assert.equal(wrapAnsi('ab👨‍👩‍👧‍👦cd', 4, {hard: true}), 'ab👨‍👩‍👧‍👦\ncd');
	assert.equal(wrapAnsi('ab🇺🇸cd', 4, {hard: true}), 'ab🇺🇸\ncd');

	// Soft wrapping does not split grapheme clusters
	assert.equal(wrapAnsi('test 👨‍👩‍👧‍👦', 4), 'test\n👨‍👩‍👧‍👦');

	// Colored grapheme clusters preserve ANSI codes across wraps
	assert.equal(stripAnsi(wrapAnsi(chalk.red('a👨‍👩‍👧‍👦b'), 2, {hard: true})), 'a\n👨‍👩‍👧‍👦\nb');
});

test('#23, properly wraps whitespace with no trimming', () => {
	assert.equal(wrapAnsi('   ', 2, {trim: false}), '  \n ');
	assert.equal(wrapAnsi('   ', 2, {trim: false, hard: true}), '  \n ');
});

test('#24, trims leading and trailing whitespace only on actual wrapped lines and only with trimming', () => {
	assert.equal(wrapAnsi('   foo   bar   ', 3), 'foo\nbar');
	assert.equal(wrapAnsi('   foo   bar   ', 6), 'foo\nbar');
	assert.equal(wrapAnsi('   foo   bar   ', 42), 'foo   bar');
	assert.equal(wrapAnsi('   foo   bar   ', 42, {trim: false}), '   foo   bar   ');
});

test('#24, trims leading and trailing whitespace inside a color block only on actual wrapped lines and only with trimming', () => {
	assert.equal(wrapAnsi(chalk.blue('   foo   bar   '), 6), chalk.blue('foo\nbar'));
	assert.equal(wrapAnsi(chalk.blue('   foo   bar   '), 42), chalk.blue('foo   bar'));
	assert.equal(wrapAnsi(chalk.blue('   foo   bar   '), 42, {trim: false}), chalk.blue('   foo   bar   '));
});

test('#25, properly wraps whitespace between words with no trimming', () => {
	assert.equal(wrapAnsi('foo bar', 3), 'foo\nbar');
	assert.equal(wrapAnsi('foo bar', 3, {hard: true}), 'foo\nbar');
	assert.equal(wrapAnsi('foo bar', 3, {trim: false}), 'foo\n \nbar');
	assert.equal(wrapAnsi('foo bar', 3, {trim: false, hard: true}), 'foo\n \nbar');
});

test('#26, does not multiply leading spaces with no trimming', () => {
	assert.equal(wrapAnsi(' a ', 10, {trim: false}), ' a ');
	assert.equal(wrapAnsi('   a ', 10, {trim: false}), '   a ');
});

test('#27, does not remove spaces in line with ansi escapes when no trimming', () => {
	assert.equal(wrapAnsi(chalk.bgGreen(` ${chalk.black('OK')} `), 100, {trim: false}), chalk.bgGreen(` ${chalk.black('OK')} `));
	assert.equal(wrapAnsi(chalk.bgGreen(`  ${chalk.black('OK')} `), 100, {trim: false}), chalk.bgGreen(`  ${chalk.black('OK')} `));
	assert.equal(wrapAnsi(chalk.bgGreen(' hello '), 10, {hard: true, trim: false}), chalk.bgGreen(' hello '));
});

test('#43, preserves nested foreground and background styles on every wrapped line', () => {
	const result = wrapAnsi(chalk.bgGreen.black('test'), 2, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u001B[42m\u001B[30mte\u001B[39m\u001B[49m\n\u001B[42m\u001B[30mst\u001B[39m\u001B[49m');
});

test('#43, preserves stacked modifiers and colors on every wrapped line', () => {
	const result = wrapAnsi(chalk.blue.bold('test'), 2, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u001B[34m\u001B[1mte\u001B[22m\u001B[39m\n\u001B[34m\u001B[1mst\u001B[22m\u001B[39m');
});

test('#43, preserves combined SGR parameters across wrapped lines', () => {
	const input = '\u001B[1;34mtest\u001B[39;22m';
	const result = wrapAnsi(input, 2, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u001B[1;34mte\u001B[39m\u001B[22m\n\u001B[1m\u001B[34mst\u001B[39;22m');
});

test('#43, preserves truecolor foreground and background styles on every wrapped line', () => {
	const input = '\u001B[48;2;255;0;0m\u001B[38;2;0;0;0mtest\u001B[39m\u001B[49m';
	const result = wrapAnsi(input, 2, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u001B[48;2;255;0;0m\u001B[38;2;0;0;0mte\u001B[39m\u001B[49m\n\u001B[48;2;255;0;0m\u001B[38;2;0;0;0mst\u001B[39m\u001B[49m');
});

test('#43, preserves colon-delimited RGB styles on every wrapped line', () => {
	const input = '\u001B[38:2::255:0:0mabcdefghij\u001B[39m';
	const result = wrapAnsi(input, 5, {hard: true});
	assert.equal(result, '\u001B[38:2::255:0:0mabcde\u001B[39m\n\u001B[38:2::255:0:0mfghij\u001B[39m');

	const mixedResult = wrapAnsi('\u001B[1;38:5:196mabcdefghij\u001B[0m', 5, {hard: true});
	assert.equal(mixedResult, '\u001B[1;38:5:196mabcde\u001B[39m\u001B[22m\n\u001B[1m\u001B[38:5:196mfghij\u001B[0m');
});

test('#43, does not treat malformed extended color parameters as modifiers', () => {
	const malformedForeground = wrapAnsi('\u001B[38;2;255mab\u001B[0m', 1, {hard: true, trim: false, wordWrap: false});
	const malformedBackground = wrapAnsi('\u001B[48;5mab\u001B[0m', 1, {hard: true, trim: false, wordWrap: false});
	assert.equal(malformedForeground, '\u001B[38;2;255ma\nb\u001B[0m');
	assert.equal(malformedBackground, '\u001B[48;5ma\nb\u001B[0m');
});

test('#43, tracks a parameter that follows an extended color in the same sequence', () => {
	const after256 = wrapAnsi('\u001B[38;5;196;1mabcdefghij\u001B[39m\u001B[22m', 5, {hard: true});
	const afterRgb = wrapAnsi('\u001B[38;2;255;0;0;1mabcdefghij\u001B[39m\u001B[22m', 5, {hard: true});
	assert.equal(after256, '\u001B[38;5;196;1mabcde\u001B[22m\u001B[39m\n\u001B[38;5;196m\u001B[1mfghij\u001B[39m\u001B[22m');
	assert.equal(afterRgb, '\u001B[38;2;255;0;0;1mabcde\u001B[22m\u001B[39m\n\u001B[38;2;255;0;0m\u001B[1mfghij\u001B[39m\u001B[22m');
});

test('does not treat zero-argument semicolon color modes as colors', () => {
	for (const mode of [0, 1]) {
		const result = wrapAnsi(`\u001B[38;${mode}mabcdefghij\u001B[39m`, 5, {hard: true});
		assert.equal(result, `\u001B[38;${mode}mabcde\nfghij\u001B[39m`);
	}
});

test('#43, treats omitted SGR params as reset', () => {
	const colorThenReset = wrapAnsi('\u001B[31;mab\u001B[0m', 1, {hard: true, trim: false, wordWrap: false});
	const boldResetThenColor = wrapAnsi('\u001B[1;;31mab\u001B[0m', 1, {hard: true, trim: false, wordWrap: false});
	assert.equal(colorThenReset, '\u001B[31;ma\nb\u001B[0m');
	assert.equal(boldResetThenColor, '\u001B[1;;31ma\u001B[39m\n\u001B[31mb\u001B[0m');
});

test('#43, preserves C1 CSI SGR styles across wrapped lines', () => {
	const result = wrapAnsi('\u009B1;34mtest\u009B39;22m', 2, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u009B1;34mte\u001B[39m\u001B[22m\n\u001B[1m\u001B[34mst\u009B39;22m');
});

test('#43, preserves underline color SGR styles across wrapped lines', () => {
	const result = wrapAnsi('\u001B[58;5;196mtest\u001B[59m', 2, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u001B[58;5;196mte\u001B[59m\n\u001B[58;5;196mst\u001B[59m');
});

test('#43, preserves bold and dim styles across wrapped lines', () => {
	const result = wrapAnsi('\u001B[1m\u001B[2mtest\u001B[22m', 2, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u001B[1m\u001B[2mte\u001B[22m\u001B[22m\n\u001B[1m\u001B[2mst\u001B[22m');
});

test('#43, clears both bold and dim when reset 22 appears at wrapped line start', () => {
	const result = wrapAnsi('\u001B[1m\u001B[2mab\u001B[22mcd', 1, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u001B[1m\u001B[2ma\u001B[22m\u001B[22m\n\u001B[1m\u001B[2mb\u001B[22m\u001B[22m\n\u001B[22mc\nd');
});

test('#43, does not reopen styles that are reset by a combined SGR sequence at wrapped line start', () => {
	const result = wrapAnsi('\u001B[1;2;31mab\u001B[22;39mcd', 1, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u001B[1;2;31ma\u001B[39m\u001B[22m\u001B[22m\n\u001B[1m\u001B[2m\u001B[31mb\u001B[39m\u001B[22m\u001B[22m\n\u001B[22;39mc\nd');
});

test('#43, handles C1 SGR reset at wrapped line start for stacked modifiers', () => {
	const result = wrapAnsi('\u009B1m\u009B2mab\u009B22mcd', 1, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u009B1m\u009B2ma\u001B[22m\u001B[22m\n\u001B[1m\u001B[2mb\u001B[22m\u001B[22m\n\u009B22mc\nd');
});

test('#43, does not duplicate reopen output when the same modifier is applied repeatedly', () => {
	const result = wrapAnsi('\u001B[1m\u001B[1mtest\u001B[22m', 2, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u001B[1m\u001B[1mte\u001B[22m\n\u001B[1mst\u001B[22m');
});

test('#43, does not reopen modifiers that are immediately reset at wrapped line start', () => {
	const result = wrapAnsi('\u001B[1mab\u001B[22mcd', 1, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u001B[1ma\u001B[22m\n\u001B[1mb\u001B[22m\n\u001B[22mc\nd');
});

test('#43, does not reopen colors that are immediately reset at wrapped line start', () => {
	const result = wrapAnsi('\u001B[31mab\u001B[39mcd', 1, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u001B[31ma\u001B[39m\n\u001B[31mb\u001B[39m\n\u001B[39mc\nd');
});

test('#43, does not reopen background when reset at wrapped line start while preserving foreground', () => {
	const result = wrapAnsi('\u001B[31m\u001B[42mab\u001B[49mcd', 1, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u001B[31m\u001B[42ma\u001B[49m\u001B[39m\n\u001B[31m\u001B[42mb\u001B[49m\u001B[39m\n\u001B[31m\u001B[49mc\u001B[39m\n\u001B[31md');
});

test('#43, does not reopen non-22 modifiers that are immediately reset at wrapped line start', () => {
	const result = wrapAnsi('\u001B[9mab\u001B[29mcd', 1, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u001B[9ma\u001B[29m\n\u001B[9mb\u001B[29m\n\u001B[29mc\nd');
});

test('#43, does not reopen styles reset after a leading hyperlink escape at wrapped line start', () => {
	const belResult = wrapAnsi('\u001B[31mab\u001B]8;;https://example.com\u0007\u001B[39mc\u001B]8;;\u0007', 1, {hard: true, trim: false, wordWrap: false});
	const stResult = wrapAnsi('\u001B[31mab\u001B]8;;https://example.com\u001B\\\u001B[39mc\u001B]8;;\u001B\\', 1, {hard: true, trim: false, wordWrap: false});
	assert.equal(belResult, '\u001B[31ma\u001B[39m\n\u001B[31mb\u001B[39m\n\u001B]8;;https://example.com\u0007\u001B[39mc\u001B]8;;\u0007');
	assert.equal(stResult, '\u001B[31ma\u001B[39m\n\u001B[31mb\u001B[39m\n\u001B]8;;https://example.com\u001B\\\u001B[39mc\u001B]8;;\u001B\\');
});

test('#43, does not reopen styles when a full reset is immediately applied at wrapped line start', () => {
	const result = wrapAnsi('\u001B[31;1mab\u001B[0mcd', 1, {hard: true, trim: false, wordWrap: false});
	assert.equal(result, '\u001B[31;1ma\u001B[22m\u001B[39m\n\u001B[31m\u001B[1mb\u001B[22m\u001B[39m\n\u001B[0mc\nd');
});

test('#35, wraps hyperlinks, preserving clickability in supporting terminals', () => {
	const result1 = wrapAnsi('Check out \u001B]8;;https://www.example.com\u0007my website\u001B]8;;\u0007, it is \u001B]8;;https://www.example.com\u0007supercalifragilisticexpialidocious\u001B]8;;\u0007.', 16, {hard: true});
	assert.equal(result1, 'Check out \u001B]8;;https://www.example.com\u0007my\u001B]8;;\u0007\n\u001B]8;;https://www.example.com\u0007website\u001B]8;;\u0007, it is\n\u001B]8;;https://www.example.com\u0007supercalifragili\u001B]8;;\u0007\n\u001B]8;;https://www.example.com\u0007sticexpialidocio\u001B]8;;\u0007\n\u001B]8;;https://www.example.com\u0007us\u001B]8;;\u0007.');

	const result2 = wrapAnsi(`Check out \u001B]8;;https://www.example.com\u0007my \uD83C\uDE00 ${chalk.bgGreen('website')}\u001B]8;;\u0007, it ${chalk.bgRed('is \u001B]8;;https://www.example.com\u0007super\uD83C\uDE00califragilisticexpialidocious\u001B]8;;\u0007')}.`, 16, {hard: true});
	assert.equal(result2, 'Check out \u001B]8;;https://www.example.com\u0007my 🈀\u001B]8;;\u0007\n\u001B]8;;https://www.example.com\u0007\u001B[42mwebsite\u001B[49m\u001B]8;;\u0007, it \u001B[41mis\u001B[49m\n\u001B[41m\u001B]8;;https://www.example.com\u0007super🈀califragi\u001B]8;;\u0007\u001B[49m\n\u001B[41m\u001B]8;;https://www.example.com\u0007listicexpialidoc\u001B]8;;\u0007\u001B[49m\n\u001B[41m\u001B]8;;https://www.example.com\u0007ious\u001B]8;;\u0007\u001B[49m.');
});

test('wraps ST-terminated hyperlinks correctly', () => {
	// Single word wider than columns, forcing hard wrap through wrapWord.
	const result = wrapAnsi('\u001B]8;;https://example.com\u001B\\abcdefghij\u001B]8;;\u001B\\', 5, {hard: true});
	assert.equal(result, '\u001B]8;;https://example.com\u001B\\abcde\u001B]8;;\u0007\n\u001B]8;;https://example.com\u0007fghij\u001B]8;;\u001B\\');

	// Soft wrap - 10-char visible text should fit in 20 columns without wrapping
	const result2 = wrapAnsi('\u001B]8;;https://example.com\u001B\\Click here\u001B]8;;\u001B\\', 20);
	assert.ok(!result2.includes('\n'));
	assert.ok(result2.includes('\u001B]8;;https://example.com\u001B\\'));

	// Soft wrap that straddles a line break - hyperlink should be closed/reopened
	const result3 = wrapAnsi('\u001B]8;;https://example.com\u001B\\hello world\u001B]8;;\u001B\\', 5);
	const lines = result3.split('\n');
	assert.equal(lines.length, 2);
	assert.equal(stripAnsi(lines[0]), 'hello');
	assert.equal(stripAnsi(lines[1]), 'world');
	// Each line should have the hyperlink open and close tags
	assert.ok(lines[0].includes('\u001B]8;;https://example.com'));
	assert.ok(lines[1].includes('\u001B]8;;https://example.com'));

	// Mixed BEL and ST terminators in same string
	const result4 = wrapAnsi(
		'\u001B]8;;https://a.com\u0007hello\u001B]8;;\u0007 \u001B]8;;https://b.com\u001B\\world\u001B]8;;\u001B\\',
		20,
	);
	assert.ok(!result4.includes('\n'));
});

test('does not mix URLs when wrapping multiple BEL-terminated hyperlinks', () => {
	const result = wrapAnsi('\u001B]8;;https://a.com\u0007one\u001B]8;;\u0007 \u001B]8;;https://b.com\u0007twothree\u001B]8;;\u0007', 4, {hard: true});
	const lines = result.split('\n');
	assert.deepEqual(lines.map(line => stripAnsi(line)), ['one', 'twot', 'hree']);
	assert.ok(lines[0].includes('https://a.com'));
	assert.ok(!lines[0].includes('https://b.com'));
	assert.ok(lines[1].includes('https://b.com'));
	assert.ok(!lines[1].includes('https://a.com'));
	assert.ok(lines[2].includes('https://b.com'));
	assert.ok(!lines[2].includes('https://a.com'));
});

test('does not mix URLs when wrapping multiple ST-terminated hyperlinks', () => {
	const result = wrapAnsi('\u001B]8;;https://a.com\u001B\\one\u001B]8;;\u001B\\ \u001B]8;;https://b.com\u001B\\twothree\u001B]8;;\u001B\\', 4, {hard: true});
	const lines = result.split('\n');
	assert.deepEqual(lines.map(line => stripAnsi(line)), ['one', 'twot', 'hree']);
	assert.ok(lines[0].includes('https://a.com'));
	assert.ok(!lines[0].includes('https://b.com'));
	assert.ok(lines[1].includes('https://b.com'));
	assert.ok(!lines[1].includes('https://a.com'));
	assert.ok(lines[2].includes('https://b.com'));
	assert.ok(!lines[2].includes('https://a.com'));
});

test('does not scan ahead to a later BEL hyperlink from an invalid escape', () => {
	const result = wrapAnsi('\u001Bfoo abc \u001B]8;;https://ok.com\u0007ok\u001B]8;;\u0007', 4, {hard: true});
	const lines = result.split('\n');
	const abcLine = lines.find(line => stripAnsi(line).includes('abc'));
	const okLine = lines.find(line => stripAnsi(line).includes('ok'));
	assert.ok(abcLine);
	assert.ok(okLine);
	assert.ok(!abcLine.includes('https://ok.com'));
	assert.ok(okLine.includes('https://ok.com'));
});

test('does not scan ahead to a later ST hyperlink from an invalid escape', () => {
	const result = wrapAnsi('\u001Bfoo abc \u001B]8;;https://ok.com\u001B\\ok\u001B]8;;\u001B\\', 4, {hard: true});
	const lines = result.split('\n');
	const abcLine = lines.find(line => stripAnsi(line).includes('abc'));
	const okLine = lines.find(line => stripAnsi(line).includes('ok'));
	assert.ok(abcLine);
	assert.ok(okLine);
	assert.ok(!abcLine.includes('https://ok.com'));
	assert.ok(okLine.includes('https://ok.com'));
});

test('does not scan ahead from an unterminated OSC prelude to a later BEL hyperlink', () => {
	const result = wrapAnsi('\u001B]8;;unterminated abc \u001B]8;;https://ok.com\u0007ok\u001B]8;;\u0007', 5, {hard: true});
	const lines = result.split('\n');
	const abcLine = lines.find(line => stripAnsi(line).includes('abc'));
	const okLine = lines.find(line => stripAnsi(line).includes('ok'));
	assert.ok(abcLine);
	assert.ok(okLine);
	assert.ok(!abcLine.includes('https://ok.com'));
	assert.ok(okLine.includes('https://ok.com'));
});

test('does not scan ahead from an unterminated OSC prelude to a later ST hyperlink', () => {
	const result = wrapAnsi('\u001B]8;;unterminated abc \u001B]8;;https://ok.com\u001B\\ok\u001B]8;;\u001B\\', 5, {hard: true});
	const lines = result.split('\n');
	const abcLine = lines.find(line => stripAnsi(line).includes('abc'));
	const okLine = lines.find(line => stripAnsi(line).includes('ok'));
	assert.ok(abcLine);
	assert.ok(okLine);
	assert.ok(!abcLine.includes('https://ok.com'));
	assert.ok(okLine.includes('https://ok.com'));
});

test('keeps repeated unterminated OSC sequences as text', () => {
	const input = '\u001B]x'.repeat(4) + 'abc';
	const result = wrapAnsi(input, 5, {hard: true, trim: false});
	assert.equal(result.replaceAll('\n', ''), input);
	assert.equal(wrapAnsi('\u001B]bad\u001BPbad\u0007ab', 5, {hard: true, trim: false}), '\u001B]bad\u001BP\nbad\u0007ab');
});

test('handles repeated unterminated OSC sequences efficiently', {timeout: 3000}, () => {
	const input = '\u001B]x'.repeat(80_000) + '\u001B[31mabcdefghij\u001B[39m';
	const result = wrapAnsi(input, 80, {hard: true, trim: false});
	assert.equal(result.replaceAll('\n', ''), input);
});

test('covers non-SGR/non-hyperlink ansi escapes', () => {
	assert.equal(wrapAnsi('Hello, \u001B[1D World!', 8), 'Hello,\u001B[1D\nWorld!');
	assert.equal(wrapAnsi('Hello, \u001B[1D World!', 8, {trim: false}), 'Hello, \u001B[1D \nWorld!');
});

test('wraps parameterized hyperlinks without exposing their control payload', () => {
	const result = wrapAnsi('\u001B]8;id=md-test;https://example.com\u0007abcdefghij\u001B]8;;\u0007', 5, {hard: true});
	assert.equal(result, '\u001B]8;id=md-test;https://example.com\u0007abcde\u001B]8;;\u0007\n\u001B]8;id=md-test;https://example.com\u0007fghij\u001B]8;;\u0007');
});

test('keeps semicolons in the URI of a parameterized hyperlink', () => {
	const result = wrapAnsi('\u001B]8;id=1:foo=bar;https://example.com/a;b\u001B\\abcdefghij\u001B]8;;\u001B\\', 5, {hard: true});
	const lines = result.split('\n');
	assert.equal(lines.length, 2);
	assert.equal(stripAnsi(lines[0]), 'abcde');
	assert.equal(stripAnsi(lines[1]), 'fghij');
	assert.ok(lines[1].startsWith('\u001B]8;id=1:foo=bar;https://example.com/a;b'));
});

test('keeps generic OSC commands intact', () => {
	for (const terminator of ['\u0007', '\u001B\\']) {
		const input = `\u001B]0;window title${terminator}abcdefghij`;
		assert.equal(wrapAnsi(input, 5, {hard: true}), `\u001B]0;window title${terminator}abcde\nfghij`);
	}
});

test('treats OSC commands containing controls as plain text', () => {
	for (const control of ['\u0001', '\u0018', '\u001A', '\u0090']) {
		const input = `\u001B]0;ab${control}cdefghij\u0007XYZ`;
		const result = wrapAnsi(input, 5, {hard: true, trim: false});
		assert.equal(result.replaceAll('\n', ''), input);
		assert.ok(result.includes('\n'));
		assert.ok(result.indexOf('\n') < result.indexOf('\u0007'));
	}
});

test('keeps an OSC 8 sequence without a URI field opaque', () => {
	assert.equal(wrapAnsi('\u001B]8;x\u0007abcde', 3, {hard: true, trim: false}), '\u001B]8;x\u0007abc\nde');
});

test('wraps a parameterized hyperlink across more than two rows', () => {
	const result = wrapAnsi('\u001B]8;id=x;https://example.com\u0007abcdefghijklmno\u001B]8;;\u0007', 5, {hard: true});
	const lines = result.split('\n');
	assert.equal(lines.length, 3);
	assert.deepEqual(lines.map(line => stripAnsi(line)), ['abcde', 'fghij', 'klmno']);
	for (const line of lines) {
		assert.ok(line.startsWith('\u001B]8;id=x;https://example.com\u0007'));
		assert.ok(line.endsWith('\u001B]8;;\u0007'));
	}
});

test('keeps the parameters of adjacent hyperlinks separate', () => {
	const result = wrapAnsi('\u001B]8;id=a;https://a.com\u0007one\u001B]8;;\u0007 \u001B]8;id=b;https://b.com\u0007twothree\u001B]8;;\u0007', 4, {hard: true});
	assert.deepEqual(result.split('\n'), [
		'\u001B]8;id=a;https://a.com\u0007one\u001B]8;;\u0007',
		'\u001B]8;id=b;https://b.com\u0007twot\u001B]8;;\u0007',
		'\u001B]8;id=b;https://b.com\u0007hree\u001B]8;;\u0007',
	]);
});

test('wraps around non-SGR CSI sequences without swallowing the text', () => {
	// The escape scanner used to run until the next `m`, so a CSI sequence with any other final byte ate the rest of the line.
	assert.equal(wrapAnsi('\u001B[2Jabcdefghij', 5, {hard: true}), '\u001B[2Jabcde\nfghij');
	assert.equal(wrapAnsi('\u001B[1;2Habcdefghij', 5, {hard: true}), '\u001B[1;2Habcde\nfghij');
	assert.equal(wrapAnsi('\u001B[?25labcdefghij', 5, {hard: true}), '\u001B[?25labcde\nfghij');
	assert.equal(wrapAnsi('\u001B[>4mabcdefghij', 5, {hard: true}), '\u001B[>4mabcde\nfghij');
	assert.equal(wrapAnsi('\u001B[Aabcdefghij', 5, {hard: true}), '\u001B[Aabcde\nfghij');
});

test('keeps CSI intermediate bytes intact', () => {
	// `ESC [ 1 SP q` sets the cursor shape. Its space is part of the sequence, not a word separator.
	assert.equal(wrapAnsi('\u001B[1 qabcdefghij', 5, {hard: true}), '\u001B[1 qabcde\nfghij');
});

test('wraps around C1 CSI sequences', () => {
	assert.equal(wrapAnsi('\u009B2Jabcdefghij', 5, {hard: true}), '\u009B2Jabcde\nfghij');
});

test('a non-SGR CSI sequence at a wrapped line start does not stop style reopening', () => {
	const result = wrapAnsi('\u001B[31mab\u001B[2Kc', 1, {hard: true, trim: false, wordWrap: false});
	const lines = result.split('\n');
	assert.equal(lines.length, 3);
	assert.ok(lines[2].includes('\u001B[2K'));
	assert.ok(lines[2].includes('\u001B[31m'));
});

test('treats an unterminated control string as plain text', () => {
	// Without a terminator nothing can be skipped, so the payload is wrapped as the visible text it appears to be.
	assert.equal(wrapAnsi('\u001BPunterminated', 5, {hard: true}), '\u001BPunte\nrmina\nted');
	assert.equal(wrapAnsi('\u0090unterminated', 5, {hard: true}), '\u0090unter\nminat\ned');
	assert.equal(wrapAnsi('\u009Funterminated', 5, {hard: true}), '\u009Funter\nminat\ned');
	assert.equal(wrapAnsi('\u001B]0;ab cde', 5, {hard: true}), '\u001B]0;ab\ncde');
});

test('treats unsupported control-string families as plain text', () => {
	for (const introducer of ['\u001BP', '\u001BX', '\u001B^', '\u001B_']) {
		const input = `${introducer}payload with spaces\u001B\\abcdefghij`;
		assert.equal(wrapAnsi(input, 5, {hard: true, trim: false}), `${introducer}payl\noad \nwith \nspace\ns\u001B\\abc\ndefgh\nij`);
	}

	const c1Input = '\u0090payload with spaces\u009Cabcdefghij';
	assert.equal(wrapAnsi(c1Input, 5, {hard: true, trim: false}), '\u0090paylo\nad \nwith \nspace\ns\u009Cabcd\nefghi\nj');
	assert.equal(wrapAnsi('\u001B#8abcdefghij', 5, {hard: true, trim: false}), '\u001B#8abc\ndefgh\nij');
	assert.equal(wrapAnsi('\u001B[3\n1mabcdefghij', 5, {hard: true, trim: false}), '\u001B[3\n1mabc\ndefgh\nij');
});

test('#62, wraps a parameterized hyperlink that also carries SGR styles', () => {
	const result = wrapAnsi('\u001B[31m\u001B]8;id=x;https://example.com\u0007abcdefghij\u001B]8;;\u0007\u001B[39m', 5, {hard: true});
	assert.equal(result, '\u001B[31m\u001B]8;id=x;https://example.com\u0007abcde\u001B]8;;\u0007\u001B[39m\n\u001B[31m\u001B]8;id=x;https://example.com\u0007fghij\u001B]8;;\u0007\u001B[39m');
});

test('#62, wraps a parameterized hyperlink on word boundaries in soft wrap mode', () => {
	const result = wrapAnsi('\u001B]8;id=x;https://example.com\u0007hello world\u001B]8;;\u0007', 5);
	const lines = result.split('\n');
	assert.equal(lines.length, 2);
	assert.equal(stripAnsi(lines[0]), 'hello');
	assert.equal(stripAnsi(lines[1]), 'world');
	for (const line of lines) {
		assert.ok(line.includes('\u001B]8;id=x;https://example.com\u0007'));
	}
});

test('reopens SGR styles across a wrap between fullwidth characters', () => {
	// The row fills at four columns, so the break lands before the third character rather than at the column count.
	assert.equal(wrapAnsi('\u001B[31m日本語\u001B[39m', 5, {hard: true}), '\u001B[31m日本\u001B[39m\n\u001B[31m語\u001B[39m');
});

test('#39, normalizes newlines', () => {
	assert.equal(wrapAnsi('foobar\r\nfoobar\r\nfoobar\nfoobar', 3, {hard: true}), 'foo\nbar\nfoo\nbar\nfoo\nbar\nfoo\nbar');
	assert.equal(wrapAnsi('foo bar\r\nfoo bar\r\nfoo bar\nfoo bar', 3), 'foo\nbar\nfoo\nbar\nfoo\nbar\nfoo\nbar');
});

test('#54, expands tabs before wrapping', () => {
	const result = wrapAnsi('\t\t\t\ttestingtesting', 10, {hard: true, trim: false});
	assert.equal(result, '          \n          \n          \n  testingt\nesting');
});

test('#54, uses tab stops while expanding tabs', () => {
	const result = wrapAnsi('1234\ttest', 10, {hard: true, trim: false});
	assert.equal(result, '1234    \ntest');
});

test('#54, tab expansion ignores ANSI codes when computing column position', () => {
	const result = wrapAnsi(chalk.red('ab') + '\tcd', 20);
	assert.equal(stripAnsi(result), 'ab      cd');
});

test('preserves tab stops across ANSI-split grapheme clusters', () => {
	const input = '👨\u001B[31m‍👩‍👧‍👦\tX';
	assert.equal(wrapAnsi(input, 30, {trim: false}), '👨\u001B[31m‍👩‍👧‍👦      X');
});

test('closes and reopens styles around a carriage return before a wrap', () => {
	const result = wrapAnsi('\u001B[31mfoo\r bar\u001B[39m', 3);
	assert.equal(result, '\u001B[31mfoo\r\u001B[39m\n\u001B[31mbar\u001B[39m');
});

test('keeps a row of zero-width words linear rather than quadratic', {timeout: 3000}, () => {
	const zeroWidthWords = 'a' + ' \u001B[31m'.repeat(80_000);
	assert.equal(stripAnsi(wrapAnsi(zeroWidthWords, 80)), 'a');

	const unterminatedCsi = `\u001B[${'1'.repeat(80_000)}${' '.repeat(80_000)}`;
	assert.ok(wrapAnsi(unterminatedCsi, 80).startsWith(`\u001B[${'1'.repeat(80_000)}`));
});

test('places the word after a hard-wrapped word at the right column', () => {
	// The row that the long word ends on decides where the next word goes.
	assert.equal(wrapAnsi('aaabb c', 3, {hard: true}), 'aaa\nbb\nc');
	assert.equal(wrapAnsi('aaab c', 3, {hard: true}), 'aaa\nb c');
	assert.equal(wrapAnsi('aaaaaa b', 3, {hard: true}), 'aaa\naaa\nb');
});

test('does not reopen styles on a trailing empty row', () => {
	assert.equal(wrapAnsi('\u001B[31mabc ', 3, {wordWrap: false}), '\u001B[31mabc\u001B[39m\n');
	assert.equal(wrapAnsi('\u001B]8;;https://example.com\u0007abc ', 3, {wordWrap: false}), '\u001B]8;;https://example.com\u0007abc\u001B]8;;\u0007\n');
});
