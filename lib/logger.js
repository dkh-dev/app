'use strict'

const fs = require('fs')

const HttpError = require('./http-error')
const isProduction = require('./utils/is-production')
const now = require('./utils/now')


/**
 * @member {Function} info
 * @member {Function} error
 * @member {Function} debug
 */
class Logger {
  constructor(config) {
    // [ { name: file } ]
    const streams = Object.entries(config)

    if (isProduction) {
      /**
       * Stores write streams for releasing them as needed.
       */
      this.streams = new Set()

      streams.forEach(([ name, file ]) => {
        this.stream(name, file)
      })

      this.debug = this.constructor.void
    } else {
      streams.forEach(([ name ]) => {
        this[ name ] = this.constructor.log
      })

      this.error = this.constructor.error
      this.debug = this.constructor.log
    }
  }

  stream(name, file) {
    if (!name || !file) {
      return
    }

    const stream = fs.createWriteStream(
      file,
      this.constructor.writeStreamOptions,
    )

    stream.on('error', error => {
      throw error
    })

    this[ name ] = (...any) => {
      const data = any.map(this.constructor.stringify).join(' ')

      stream.write(`[${ now() }] ${ data }\n`, this.constructor.void)
    }

    this.streams.add(stream)
  }

  close() {
    if (isProduction) {
      this.streams.forEach(stream => stream.close())
    }
  }

  static stringify(any) {
    let data

    if (typeof any !== 'object' || any === null) {
      data = String(any)
    } else if (any instanceof HttpError) {
      const { name, code, message } = any

      data = `${ name }: ${ code }${ message ? ` ${ message }` : '' }`
    } else if (any instanceof Error) {
      const { name, message, stack } = any

      data = `${ name }: ${ message }\n${ stack }`
    } else {
      data = JSON.stringify(any)
    }

    return data
  }

  static log(...any) {
    console.log(`[${ now() }]`, ...any)
  }

  static error(...any) {
    console.error(`${ now() }`, ...any)
  }

  static void() {
    // does nothing
  }
}

Logger.writeStreamOptions = {
  flags: 'a',
  mode: 0o664,
}

module.exports = Logger
