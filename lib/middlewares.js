'use strict'

class Middlewares {
    constructor(app) {
        this.app = app
    }

    use(middlewares) {
        const entries = Object.entries(middlewares)

        entries.forEach(([ path, middlewares ]) => {
            middlewares.forEach(middleware => {
                const wrapper = this.wrap(middleware)

                if (path === '/' || path === '/*') {
                    return void this.app.express.use(wrapper)
                }

                this.app.express.use(path, wrapper)
            })
        })
    }

    wrap(middleware) {
        if (middleware.length >= 3) {
            return middleware
        }

        return async (req, res, next) => {
            try {
                await middleware(req, res)

                return void next()
            } catch (error) {
                this.app.handler.error(error, req, res)
            }
        }
    }
}

module.exports = Middlewares
