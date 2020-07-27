'use strict'

const fs = require('fs')

const argv = require('@dkh-dev/argv')
const yaml = require('js-yaml')

const isProduction = require('./utils/is-production')


/**
 * Note:
 *
 * - `database.authentication_database = database.name`
 * - `session.cookie.secure = isProduction`
 */
const FALLBACK_CONFIGURATION = {
  server: {
    port: 8080,
    ssl_port: 4343,
    post_max_size: 1000,
    keep_alive_timeout: 0,
  },
  logger: {
    info: 'data/info.log',
    error: 'data/error.log',
  },
  database: {
    hostname: 'localhost',
    port: 27017,
    pool_size: 1,
    ignore_undefined: true,
  },
  key: {
    size: 64,
    encoding: 'base64',
  },
  session: {
    name: 'sessid',
    resave: false,
    save_uninitialized: false,
    cookie: {
      secure: isProduction,
      signed: true,
      path: '/',
      http_only: true,
      same_site: 'strict',
    },
  },
}

const FALLBACK_CONFIGURATION_FILE = '.config.yaml'


const file = argv.c || argv.config || FALLBACK_CONFIGURATION_FILE

let fileContents = ''

try {
  fileContents = fs.readFileSync(file)
} catch (error) {
  // if the configuration file is defined by user,
  // rethrow the error so that the user knows that something's gone wrong
  if (file !== FALLBACK_CONFIGURATION_FILE) {
    throw error
  }

  if (error.code !== 'ENOENT') {
    console.warn(error)
  }
}

const userConfig = yaml.safeLoad(fileContents) || {}
const { server, logger, database, key, session, ...others } = userConfig

const config = {
  server: {
    ...FALLBACK_CONFIGURATION.server,
    ...server,
  },
  logger: {
    ...FALLBACK_CONFIGURATION.logger,
    ...logger,
  },
  database: database
    ? {
      ...FALLBACK_CONFIGURATION.database,
      authentication_database: database.name,

      ...database,
    }
    : null,
  key: {
    ...FALLBACK_CONFIGURATION.key,
    ...key,
  },
  session: session
    ? {
      ...FALLBACK_CONFIGURATION.session,
      ...session,

      cookie: {
        ...FALLBACK_CONFIGURATION.session.cookie,
        ...session.cookie,
      },
    }
    : null,

  ...others,
}

module.exports = config
