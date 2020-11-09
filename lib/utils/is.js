'use strict'

const array = Array.isArray

const buffer = Buffer.isBuffer

const object = v => !!v && typeof v === 'object' && !array(v)

const string = v => typeof v === 'string'

const callable = v => !!v && typeof v === 'function' && v.call && v.apply

module.exports = {
  array,
  buffer,
  object,
  string,
  callable,
}
