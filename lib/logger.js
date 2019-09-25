'use strict'

const { createLogger, transports: { File, Console } } = require('winston')
const { format } = require('logform')
const ExtendedMap = require('@dkh-dev/extended-map')


const loggers = new ExtendedMap()

const errors = format.errors()
const timestamp = format.timestamp()
const json = format.json()

const add = options => {
    const { level, filename } = options

    const logger = loggers.get(level, () => createLogger({
        level,
        format: format.combine(
            timestamp,
            ...level === 'error' ? [ errors ] : [],
            json,
        ),
    }))

    if (filename) {
        logger.add(new File(options))
    }

    logger.add(new Console(options))
}

add({ level: 'debug' })

module.exports = Object.freeze({
    add,

    info(message) {
        loggers.get('info').info(message)
    },

    error(message) {
        loggers.get('error').error(message)
    },

    debug(message) {
        loggers.get('debug').debug(message)
    },
})
