'use strict'

const { Test } = require('tape')
const axios = require('axios')

const stdio = require('./stdio')
const { config: { server: { port } } } = require('../app')


axios.defaults.baseURL = `http://localhost:${ port }`


const request = (endpoint, options) => {
  const { data, headers } = options

  if (data) {
    Object.assign(options, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
    })
  }

  return axios(endpoint, { ...options, validateStatus: () => true })
}

Test.prototype.request = async function (arg0, arg1, arg2, arg3) {
  const endpoint = arg0
  const options = typeof arg2 === 'object' ? arg1 : {}
  const expected = typeof arg2 === 'object' ? arg2 : arg1
  const msg = arg3 || arg2 || endpoint

  const promise = request(endpoint, options)

  this.push(promise)

  const response = await promise

  const entries = Object.entries(expected)

  entries.forEach(([ key, value ]) => {
    if (stdio.hasOwnProperty(key)) {
      const contents = stdio[ key ]

      this.ok(contents.includes(value), msg)
    } else {
      this.eq(response[ key ], value, `${ msg } - ${ key }`)
    }
  })
}
