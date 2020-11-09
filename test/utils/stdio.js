'use strict'

const stdio = {
  stdout: '',
  stderr: '',
}

const capture = name => {
  const stream = process[ name ]
  const { write } = stream

  stream.write = (...args) => {
    write.apply(stream, args)

    // eslint-disable-next-line no-control-regex
    stdio[ name ] += args[ 0 ]?.replace?.(/\u001b\[.*?m/g, '')
  }
}

Object.keys(stdio).forEach(capture)

module.exports = stdio
