# stylelint-formatter-yasf [![Build Status](https://circleci.com/gh/HiDeoo/stylelint-formatter-yasf.svg?style=shield)](https://circleci.com/gh/HiDeoo/stylelint-formatter-yasf) [![Coverage Status](https://codecov.io/gh/HiDeoo/stylelint-formatter-yasf/branch/master/graph/badge.svg)](https://codecov.io/gh/HiDeoo/stylelint-formatter-yasf)

> Yet Another [Stylelint](https://stylelint.io/) Formatter

## About

This [Stylelint](https://stylelint.io/) formatter is heavily based on the default string formatter with only some few changes:

* All errors are individually clickable (if your terminal support it).
* Add a summary at the end when encountering errors.
* Modify the default ordering by putting errors before warnings instead of only considering positions.

[![Screenshot](https://i.imgur.com/LSLnwSl.png)](https://i.imgur.com/LSLnwSl.png)

## Installation

Using [Yarn](https://yarnpkg.com):

```
yarn add --dev stylelint-formatter-yasf
```

Using [npm](https://www.npmjs.com):

```
npm install --save-dev stylelint-formatter-yasf
```

## Usage

### CLI or npm script

```
$ stylelint file.css --custom-formatter=node_modules/stylelint-formatter-yasf
```

### [Webpack](https://webpack.js.org/)

```
const styleLintPlugin = require('stylelint-webpack-plugin');
const stylelintFormatter = require('stylelint-formatter-yasf');

module.exports = {
  // ...
  plugins: [
    new styleLintPlugin({
      formatter: stylelintFormatter,
    }),
  ],
  // ...
}
```

### [gulp-stylelint](https://www.npmjs.com/package/gulp-stylelint)

```
const gulp = require('gulp');
const stylelint = require('gulp-stylelint');
const stylelintFormatter = require('stylelint-formatter-yasf');

gulp.task('lint', () =>
  gulp.src('file.css')
  .pipe(stylelint({
    reporters: [{
      formatter: stylelintFormatter,
      console: true
    }]
  }));
);
```

## License

Licensed under the MIT License, Copyright © HiDeoo.

See [LICENSE](https://github.com/HiDeoo/stylelint-formatter-yasf/blob/master/LICENSE) for more information.
