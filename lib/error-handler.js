'use strict'

const logger = require('./logger')
const HttpError = require('./http-error')

/* eslint-disable-next-line max-params */
const errorHandler = (error, _, res, next) => {
    if (!error) {
        return void next()
    }

    logger.error(error)

    try {
        res.status(error instanceof HttpError ? error.code : 400)
    } catch (error) {
        logger.error(error)

        res.status(400)
    } finally {
        res.end()
    }
}

module.exports = errorHandler
