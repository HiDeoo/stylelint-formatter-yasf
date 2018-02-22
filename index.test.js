const formatter = require('.')

const defaultResult = {
  source: 'path/to/file.css',
  warnings: [],
  deprecations: [],
  invalidOptionWarnings: [],
}

const defaultError = {
  line: 3,
  column: 12,
  rule: 'block-no-empty',
  severity: 'error',
  text: 'You should not have an empty block (block-no-empty)',
}

let actualTTY
let actualColumns

beforeAll(() => {
  actualTTY = process.stdout.isTTY
  actualColumns = process.stdout.columns
})

beforeEach(() => {
  process.stdout.columns = 80
})

afterEach(() => {
  process.stdout.isTTY = actualTTY
  process.stdout.columns = actualColumns
})

test('should output nothing when not necessary', () => {
  const results = [defaultResult]

  expect(formatter(results)).toMatchSnapshot()
})

test('should output invalid options', () => {
  const results = [
    {
      ...defaultResult,
      invalidOptionWarnings: [
        {
          text: 'Invalid option X for rule Y',
        },
        {
          text: 'Invalid option A for rule B',
        },
        {
          text: 'Invalid option X for rule Y',
        },
      ],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()
})

test('should output deprecations', () => {
  const results = [
    {
      ...defaultResult,
      deprecations: [
        {
          text: 'Feature X has been deprecated and will be removed in the next major version.',
        },
        {
          text: 'Feature Y has been deprecated and will be removed in the next major version.',
        },
        {
          text: 'Feature X has been deprecated and will be removed in the next major version.',
        },
      ],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()
})

test('should output 1 warning', () => {
  const results = [
    {
      ...defaultResult,
      warnings: [defaultError],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()
})

test('should output multiple warnings', () => {
  const results = [
    {
      ...defaultResult,
      warnings: [
        defaultError,
        {
          ...defaultError,
          line: 44,
          column: 22,
        },
      ],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()
})

test('should output warning without TTY', () => {
  process.stdout.isTTY = false

  const results = [
    {
      ...defaultResult,
      warnings: [defaultError],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()
})

test('should not output symbols for unknown sevirity', () => {
  const results = [
    {
      ...defaultResult,
      warnings: [
        {
          ...defaultError,
          severity: 'test',
        },
      ],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()
})

test('should output warnings and errors', () => {
  const results = [
    {
      ...defaultResult,
      warnings: [
        defaultError,
        {
          ...defaultError,
          severity: 'warning',
          line: 44,
          column: 22,
        },
      ],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()
})

test('should output long warning when less than 80 columns are available', () => {
  process.stdout.columns = 60

  const results = [
    {
      ...defaultResult,
      warnings: [
        {
          ...defaultError,
          text:
            'A very very very very very very very very very very very very very very very very very very long error',
        },
      ],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()
})

test('should output long warning when more than 80 columns are available', () => {
  const results = [
    {
      ...defaultResult,
      warnings: [
        {
          ...defaultError,
          text:
            'A very very very very very very very very very very very very very very very very very very long error',
        },
      ],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()
})

test('should not output file names if not provided', () => {
  const results = [
    {
      ...defaultResult,
      source: null,
      warnings: [defaultError],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()
})

test('should not output lines & columns if not provided', () => {
  const results = [
    {
      ...defaultResult,
      warnings: [
        {
          ...defaultError,
          line: null,
          column: 22,
        },
      ],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()
})

test('should not output columns if not provided', () => {
  const results = [
    {
      ...defaultResult,
      warnings: [
        {
          ...defaultError,
          column: null,
        },
      ],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()
})

test('should output parseErrors as warnings', () => {
  const results = [
    {
      ...defaultResult,
      parseErrors: [defaultError],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()
})

test('should not try to get the relative path if starting with "<"', () => {
  const results = [
    {
      ...defaultResult,
      source: '<path/to/file.css>',
      warnings: [defaultError],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()
})

test('should properly order errors on the same line', () => {
  const results = [
    {
      ...defaultResult,
      warnings: [
        defaultError,
        {
          ...defaultError,
          column: 22,
        },
      ],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()

  results[0].warnings[1].column = 3

  expect(formatter(results)).toMatchSnapshot()
})

test('should properly order errors on different lines', () => {
  const results = [
    {
      ...defaultResult,
      warnings: [
        defaultError,
        {
          ...defaultError,
          line: 4,
        },
      ],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()

  results[0].warnings[1].line = 1

  expect(formatter(results)).toMatchSnapshot()
})

test('should properly order errors and warnings', () => {
  const results = [
    {
      ...defaultResult,
      warnings: [
        defaultError,
        {
          ...defaultError,
          line: 1,
        },
      ],
    },
  ]

  expect(formatter(results)).toMatchSnapshot()

  results[0].warnings[1].severity = 'warning'

  expect(formatter(results)).toMatchSnapshot()

  results[0].warnings[0].severity = 'warning'
  results[0].warnings[1].severity = 'error'

  expect(formatter(results)).toMatchSnapshot()
})
