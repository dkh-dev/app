'use strict'

const argv = require('@dkh-dev/argv')


module.exports = argv.production || process.env.NODE_ENV === 'production'
