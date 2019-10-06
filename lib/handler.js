'use strict'

const HttpError = require('./http-error')


class Handler {
    constructor(logger) {
        this.logger = logger

        // eslint-disable-next-line max-params, no-unused-vars
        this.error = (error, _, res, __) => {
            try {
                this.logger.error(error)

                if (!res) {
                    return
                }

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
