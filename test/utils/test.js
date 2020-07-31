'use strict'

const tape = require('tape')
const axios = require('axios')

const stdio = require('./stdio')


const ORIGIN = {
  current: null,
}

const request = options => {
  const request = typeof options === 'string' ? { endpoint: options } : options
  const { endpoint } = request

  if (request.data) {
    request.method = 'POST'
    request.headers = {
      'content-type': 'application/json',
      ...request.headers,
    }
  }

  return axios({
    ...request,
    url: `${ ORIGIN.current }${ endpoint }`,
    validateStatus: () => true,
  })
}

/**
 * `Tape` with additional methods to test network responses.
 */
const test = (name, cb) => {
  tape(name, async t => {
    t.request = async (options, expected, msg) => {
      const endpoint = options.endpoint || options
      const response = await request(options)

      const entries = Object.entries(expected)

      entries.forEach(([ key, value ]) => {
        if (stdio.hasOwnProperty(key)) {
          return void t.ok(stdio[ key ].includes(value), msg || endpoint)
        }

        t.deepEqual(response[ key ], value, `${ msg || endpoint } - ${ key }`)
      })

      return response
    }

    stdio.cork()

    await cb(t)

    stdio.uncork()

    t.end()
  })
}

test.origin = origin => {
  ORIGIN.current = origin
}

test.request = request

module.exports = test
