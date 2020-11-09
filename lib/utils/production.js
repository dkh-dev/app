'use strict'

const argv = require('@dkh-dev/argv')


/**
 * `true` if app is running in production mode.
 */
const production = argv.hasOwnProperty('production')
  ? argv.production
  // eslint-disable-next-line no-process-env
  : process.env.NODE_ENV === 'production'

module.exports = production
