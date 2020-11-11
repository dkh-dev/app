'use strict'

const { createWriteStream } = require('fs')
const { callable } = require('./utils/is')

const HttpError = require('./utils/http-error')
const map = require('./utils/map')
const now = require('./utils/now')


// helpers

const nop = () => void 0

const time = () => `[${ now() }]`

const stringify = value => {
  if (typeof value !== 'object') {
    return String(value)
  }

  if (value instanceof HttpError) {
    const { name, status, message } = value

    return `${ name }: ${ status } ${ message }`
  }

  if (value instanceof Error) {
    const { name, message, stack } = value

    return `${ name }: ${ message }\n${ stack }`
  }

  return JSON.stringify(value)
}

const entry = values => `${ time() } ${ values.map(stringify).join(' ') }\n`

const writer = stream => (...values) => stream.write(entry(values), nop)


// outputs

const stdout = (...values) => console.log(time(), ...values)

const stderr = (...errors) => console.error(time(), ...errors)

const outputs = {
  stdout,
  stderr,
  null: nop,
}

/**
 * Example:
 * ```
 * logger.info('user', user, 'accessing', resource)
 * logger.debug('querying user', user, 'from db')
 * logger.error(err)
 * ```
 *
 * @member {Function} info
 * @member {Function} error
 * @member {Function} debug
 */
class Logger {
  constructor(config) {
    this.config = config
    this.streams = []
  }

  redirect(to = null) {
    if (outputs.hasOwnProperty(to)) {
      return outputs[ to ]
    }

    if (callable(to?.write)) {
      return writer(to)
    }

    const stream = createWriteStream(to, { flags: 'a', mode: 0o664 })

    // to close the stream when necessary
    this.streams.push(stream)

    return writer(stream)
  }

  start() {
    Object.assign(this, map(this.config, to => [ void 0, this.redirect(to) ]))
  }

  close() {
    this.streams.forEach(stream => stream.close())
  }
}


module.exports = Logger
