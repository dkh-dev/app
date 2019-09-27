'use strict'

const HttpError = require('./http-error')


class Handler {
    constructor(logger) {
        this.logger = logger

        // eslint-disable-next-line max-params
        this.error = (error, _, res, next) => {
            if (!error && next) {
                return void next()
            }

            this.logger.error(error)

            if (!res) {
                return
            }

            try {
                res.status(error instanceof HttpError ? error.code : 400)
            } catch (error) {
                this.logger.error(error)

                res.status(400)
            } finally {
                res.end()
            }
        }
    }
}

module.exports = Handler
