'use strict'

const fs = require('fs')

const argv = require('@dkh-dev/argv')
const yaml = require('js-yaml')


const fallback = {
    server: {
        port: 8080,
        ssl_port: 4343,
        post_max_size: 1000,
        keep_alive_timeout: 5000,
    },
    logger: {
        info: 'data/info.log',
        error: 'data/error.log',
    },
    database: {
        hostname: 'localhost',
        port: 27017,
        // authentication_database = .name,
    },
    key: {
        size: 96,
        id_size: 32,
        encoding: 'base64',
    },
}

const file = argv.c || argv.config || 'config.yaml'
let contents = ''

try {
    contents = fs.readFileSync(file)
} catch (error) {
    if (error.code !== 'ENOENT' || file !== 'config.yaml') {
        console.log(error)
    }
}

const config = yaml.safeLoad(contents) || {}
const { server, logger, database, key, ...others } = config

module.exports = {
    server: { ...fallback.server, ...server },
    logger: { ...fallback.logger, ...logger },
    database: database ? {
        ...fallback.database,
        authentication_database: database.name,
        ...database,
    } : null,
    key: key ? { ...fallback.key, ...key } : null,
    ...others,
}
