'use strict'

const CORK = {
  current: false,
}

const stdio = {
  stdout: '',
  stderr: '',
}

const clone = name => {
  const { write } = process[ name ]

  process[ name ].write = (...args) => {
    const unitTest = Error().stack.includes('test.js')

    // in cork mode, only display logs from unit test file
    if (!CORK.current || unitTest) {
      write.apply(process[ name ], args)
    }

    if (!unitTest) {
      // eslint-disable-next-line no-control-regex
      stdio[ name ] += args[ 0 ].replace(/\u001b\[.*?m/g, '')
    }
  }
}

Object.keys(stdio).forEach(clone)

stdio.cork = () => {
  CORK.current = true
}

stdio.uncork = () => {
  CORK.current = false
}

module.exports = stdio
