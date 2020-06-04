'use strict'

const argv = require('@dkh-dev/argv')


const isProduction = argv.production || process.env.NODE_ENV === 'production'

module.exports = isProduction
