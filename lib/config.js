'use strict'

const fs = require('fs')

const argv = require('@dkh-dev/argv')
const yaml = require('js-yaml')

const production = require('./production')


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
        pool_size: 5,
        min_size: 1,
        // authentication_database = .name,
    },
    key: {
        size: 64,
        encoding: 'base64',
    },
    session: {
        name: 'sessid',
        resave: false,
        saveUninitialized: false,
        cookie: {
            path: '/',
            httpOnly: true,
            secure: production,
            sameSite: 'strict',
        },
    },
}

const fallbackFile = 'config.yaml'
const file = argv.c || argv.config || fallbackFile
let fileContents = ''

try {
    fileContents = fs.readFileSync(file)
} catch (error) {
    if (error.code !== 'ENOENT' || file !== fallbackFile) {
        console.log(error)
    }
}

const config = yaml.safeLoad(fileContents) || {}
const { server, logger, database, key, session, ...others } = config

module.exports = {
    server: { ...fallback.server, ...server },
    logger: { ...fallback.logger, ...logger },
    database: database ? {
        ...fallback.database,
        authentication_database: database.name,
        ...database,
    } : null,
    key: { ...fallback.key, ...key },
    session: session ? {
        ...fallback.session,
        ...session,
        cookie: { ...fallback.session.cookie, ...session.cookie },
    } : null,
    ...others,
}
