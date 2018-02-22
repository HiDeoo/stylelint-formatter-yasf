const _ = require('lodash')
const chalk = require('chalk')
const logSymbols = require('log-symbols')
const path = require('path')
const pluralize = require('pluralize')
const stringWidth = require('string-width')
const table = require('table')

/**
 * Table margins.
 * @type {number}
 */
const TABLE_MARGIN = 8

/**
 * Summary stats.
 * @type {Object.<string, number>}
 */
const summary = {
  deprecations: 0,
  errors: 0,
  invalidOptions: 0,
  warnings: 0,
}

/**
 * Formats the invalid options.
 * @param  {Result[]} results - The Stylelint results.
 * @return {string} The formatted invalid options.
 */
function invalidOptionsFormatter(results) {
  const invalidOptions = _.flatMap(results, (result) => _.map(result.invalidOptionWarnings, 'text'))
  const uniqueInvalidOptions = _.uniq(invalidOptions)

  summary.invalidOptions = uniqueInvalidOptions.length

  return _.reduce(
    uniqueInvalidOptions,
    (output, warning) => `${output}${chalk.red('Invalid option: ')}${warning}.\n`,
    ''
  )
}

/**
 * Formats the deprecations.
 * @param  {Result[]} results - The Stylelint results.
 * @return {string} The formatted deprecations.
 */
function deprecationsFormatter(results) {
  const deprecattions = _.flatMap(results, (result) => _.map(result.deprecations, 'text'))
  const uniqueDeprecations = _.uniq(deprecattions)

  summary.deprecations = uniqueDeprecations.length

  return _.reduce(
    uniqueDeprecations,
    (output, warning) => `${output}${chalk.yellow('Deprecated rule: ')}${warning}\n`,
    ''
  )
}

/**
 * Returns the updated column widths.
 * @param  {number[]} columnWidths - The current widths.
 * @param  {string[]} row - The new row.
 * @return {number[]} The new column widths.
 */
function getColumnWidths(columnWidths, row) {
  return _.map(columnWidths, (width, index) => Math.max(width, stringWidth(row[index])))
}

/**
 * Returns the text error width according to the number of columns available.
 * @param  {number[]} columnWidths - The current widths.
 * @return {number} The text error width.
 */
function getTextWidth(columnWidths) {
  if (!process.stdout.isTTY) {
    return columnWidths[2]
  }

  const ttyWidth = process.stdout.columns < 80 ? 80 : process.stdout.columns
  const warningWidth = _.sum(_.values(columnWidths))

  if (ttyWidth > warningWidth + TABLE_MARGIN) {
    return columnWidths[2]
  }

  const width = ttyWidth - (warningWidth - columnWidths[2] + TABLE_MARGIN)

  return width > 0 ? width : 20
}

/**
 * Returns the relative source path of an error.
 * @param  {string} source - The absolute source path of the error.
 * @return {string} The relative source path.
 */
function getRelativeSourcePath(source) {
  if (source.charAt(0) === '<') {
    return source
  }

  return path
    .relative(process.cwd(), source)
    .split(path.sep)
    .join('/')
}

/**
 * Formats the warnings.
 * @param  {Result[]} warnings - The Stylelint warnings.
 * @param  {string} source - The absolute source path of the warnings.
 * @return {string} The formatted warnings.
 */
function formatter(warnings, source) {
  if (warnings.length === 0) {
    return ''
  }

  let columnWidths = new Array(4).fill(1)
  const relativeSourcePath = source ? getRelativeSourcePath(source) : ''

  const sortedWarnings = warnings.sort((a, b) => {
    if (a.severity === b.severity) {
      if (a.line === b.line) {
        return a.column < b.column ? -1 : 1
      }

      return a.line < b.line ? -1 : 1
    } else if (a.severity === 'error' && b.severity !== 'error') {
      return -1
    }

    return 1
  })

  let output = '\n'

  if (source) {
    output += ` ${chalk.underline(relativeSourcePath)}\n`
  }

  const rows = _.map(sortedWarnings, (warning) => {
    if (warning.severity === 'error') {
      summary.errors += 1
    } else if (warning.severity === 'warning') {
      summary.warnings += 1
    }

    let location = relativeSourcePath

    if (warning.line) {
      location += _.isEmpty(location) ? warning.line : `:${warning.line}`

      if (warning.column) {
        location += `:${warning.column}`
      }
    }

    const row = [
      chalk.dim(location),
      logSymbols[warning.severity] ? logSymbols[warning.severity] : '',
      warning.text
        .replace(/[\x01-\x1A]+/g, ' ') // eslint-disable-line no-control-regex
        .replace(new RegExp(`\\((${warning.rule})\\)$`), ''),
      chalk.dim(warning.rule || ''),
    ]

    columnWidths = getColumnWidths(columnWidths, row)

    return row
  })

  output += table.table(rows, {
    border: table.getBorderCharacters('void'),
    columns: {
      0: { width: columnWidths[0] },
      1: { width: columnWidths[1] },
      2: { width: getTextWidth(columnWidths) },
      3: { width: columnWidths[3] },
    },
    drawHorizontalLine: _.constant(false),
  })

  return output
}

/**
 * Formats the Stylelint output.
 * @param  {Result[]} results - The Stylelint results.
 * @return {string} The formatted results.
 */
module.exports = (results) => {
  let output = invalidOptionsFormatter(results)
  output += deprecationsFormatter(results)

  output = _.reduce(
    results,
    (newOutput, result) => {
      // Treat parseErrors as warnings.
      if (result.parseErrors) {
        _.forEach(result.parseErrors, (error) =>
          result.warnings.push({
            line: error.line,
            column: error.column,
            rule: error.stylelintType,
            severity: 'error',
            text: `${error.text} (${error.stylelintType})`,
          })
        )
      }

      return `${newOutput}${formatter(result.warnings, result.source)}`
    },
    output
  )

  if (_.sum(_.values(summary)) > 0) {
    output += chalk.underline('\nSummary:')

    if (summary.errors > 0) {
      output += chalk.red(`\n ${logSymbols.error} ${summary.errors} ${pluralize('error', summary.errors)}`)
    }

    if (summary.warnings > 0) {
      output += chalk.yellow(`\n ${logSymbols.warning} ${summary.warnings} ${pluralize('warning', summary.warnings)}`)
    }

    if (summary.invalidOptions > 0) {
      output += chalk.red(
        `\n ${logSymbols.info} ${summary.invalidOptions} invalid ${pluralize('option', summary.invalidOptions)}`
      )
    }

    if (summary.deprecations > 0) {
      output += chalk.yellow(
        `\n ${logSymbols.info} ${summary.deprecations} ${pluralize('deprecation', summary.deprecations)}`
      )
    }
  }

  output = output.trim()

  if (!_.isEmpty(output)) {
    output = `\n${output}\n\n`
  }

  _.forEach(summary, (value, key) => {
    summary[key] = 0
  })

  return output
}
