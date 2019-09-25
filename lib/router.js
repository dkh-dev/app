'use strict'

const logger = require('./logger')
const { Stream } = require('stream')
const errorHandler = require('./error-handler')

class Router {
    constructor(app) {
        this.app = app
    }

    defineRoutes(method, routes) {
        const name = method.toString()
        const entries = Object.entries(routes)

        entries.forEach(([ path, handler ]) => {
            const failSafe = this.constructor.failSafe(handler)

            this.app[ name ](path, failSafe)
        })
    }

    static failSafe(handler) {
        return async (req, res) => {
            try {
                const response = await handler(req, res)

                if (response instanceof Stream) {
                    response.pipe(res).on('error', logger.error)
                } else {
                    res.send(response).end()
                }
            } catch (error) {
                errorHandler(error, req, res)
            }
        }
    }
}

module.exports = Router
