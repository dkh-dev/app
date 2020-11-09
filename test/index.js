/* eslint-disable global-require */

'use strict'

process.chdir(__dirname)

const argv = require('@dkh-dev/argv')
const helper = require('@dkh-dev/tape-helper')
const test = require('tape')

helper(test)

require('./unit/define-lazy-property')
require('./unit/matcher')
require('./unit/config')
require('./unit/key')

if (argv.db) {
  require('./db/key-value-store')
  require('./db/key')
}

if (argv.app) {
  require('./app/app')
}
