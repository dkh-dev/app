'use strict'

const errorHandler = require('./error-handler')


class Middlewares {
    constructor(app) {
        this.app = app
    }

    use(middlewares) {
        const entries = Object.entries(middlewares)

        entries.forEach(([ path, middleware ]) => {
            const failSafe = this.constructor.failSafe(middleware)

            if (path === '/' || path === '/*') {
                return void this.app.use(failSafe)
            }

            this.app.use(path, failSafe)
        })
    }

    static failSafe(middleware) {
        return async (req, res, next) => {
            try {
                await middleware(req)

                return void next()
            } catch (error) {
                errorHandler(error, req, res)
            }
        }
    }
}

module.exports = Middlewares
