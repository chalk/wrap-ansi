# wrap-ansi [![Build Status](https://travis-ci.org/chalk/wrap-ansi.svg?branch=master)](https://travis-ci.org/chalk/wrap-ansi)

> Wordwrap a string with [ANSI escape codes](http://en.wikipedia.org/wiki/ANSI_escape_code#Colors_and_Styles)


## Install

```
$ npm install --save wrap-ansi
```


## Usage

```js
var chalk = require('chalk');
var wrapAnsi = require('wrap-ansi');

var input = 'The quick brown ' + chalk.red('fox jumped over ') +
	'the lazy ' + chalk.green('dog and then ran away with the unicorn.');

console.log(wrapAnsi(input, 20));
```

<img width="331" src="screenshot.png">


## API

### wrapAnsi(input, columns)

#### input

Type: `string`

String with ANSI escape codes. Like one styled by [`chalk`](https://github.com/chalk/chalk).

#### columns

Type: `number`

Number of columns to wrap the text to.


## Related

- [chalk](https://github.com/chalk/chalk) - Terminal string styling done right


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
