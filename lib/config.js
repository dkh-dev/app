'use strict'

const { readFileSync } = require('fs')

const { safeLoad } = require('js-yaml')
const argv = require('@dkh-dev/argv')

const merge = require('./utils/merge')
const production = require('./utils/production')


// loads config from file
const load = () => {
  const fallback = 'app.yaml'
  const file = argv.c || argv.config || fallback

  let contents = ''

  try {
    contents = readFileSync(file)
  } catch (err) {
    // if the configuration file is defined by user,
    // rethrow the error so that the user knows that something's gone wrong
    if (file !== fallback) {
      throw err
    }

    if (err.code !== 'ENOENT') {
      console.warn(err)
    }
  }

  return safeLoad(contents) || {}
}

const config = (conf = {}) => {
  const config = {
    server: {
      port: 8080,
      keep_alive_timeout: 5000,
      max_body_size: 1000,
    },
    logger: {
      info: production ? 'data/info.log' : 'stdout',
      error: production ? 'data/error.log' : 'stderr',
      debug: production ? null : 'stdout',
    },
    database: {
      hostname: 'localhost',
      port: 27017,
      pool_size: 1,
      ignore_undefined: true,
    },
    validator: {
      strict: true,
      remove_additional: false,
    },
    key: {
      size: 64,
      encoding: 'base64',
      collection_name: 'keys',
    },
  }

  // non-enumerable
  Object.defineProperty(config, 'set', { value: c => merge(config, c) })

  config.set(load()).set(conf)

  /**
   * @member {function} set
   */
  return config
}

module.exports = config
