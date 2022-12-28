interface Options {
	/**
	By default the wrap is soft, meaning long words may extend past the column width. Setting this to `true` will make it hard wrap at the column width.

	@default false
	*/
	hard?: boolean | undefined;

	/**
	By default, an attempt is made to split words at spaces, ensuring that they don't extend past the configured columns. If wordWrap is `false`, each column will instead be completely filled splitting words as necessary.

	@default true
	*/
	wordWrap?: boolean | undefined;

	/**
	Whitespace on all lines is removed by default. Set this option to `false` if you don't want to trim.

	@default true
	*/
	trim?: boolean | undefined;
}

/**
Wrap words to the specified column width.

@param input String with ANSI escape codes. Like one styled by [`chalk`](https://github.com/chalk/chalk). Newline characters will be normalized to `\n`.
@param columns Number of columns to wrap the text to.
@param options
*/
declare function wrapAnsi(string: string, columns: number, options?: Options): string;

export default wrapAnsi;
