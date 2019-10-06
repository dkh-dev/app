'use strict'

const { Stream } = require('stream')

const ExtendedMap = require('@dkh-dev/extended-map')


class Router {
    constructor(app) {
        this.app = app

        this.wrappers = new ExtendedMap()
    }

    activate() {
        const { get, post } = this.app.settings.routes

        if (get) {
            this.route('get', get)
        }

        if (post) {
            this.route('post', post)
        }
    }

    route(method, routes) {
        const name = method.toString().toLowerCase()
        const entries = Object.entries(routes)

        entries.forEach(([ path, handler ]) => {
            this.mount(name, path, handler)
        })
    }

    mount(name, path, handler) {
        const wrapper = this.wrap(handler)

        if (path === '/' || path === '/*') {
            this.app.express[ name ](wrapper)
        }

        this.app.express[ name ](path, wrapper)
    }

    wrap(handler) {
        if (handler.length >= 3) {
            return handler
        }

        return this.wrappers.get(handler, () => async (req, res) => {
            try {
                const response = await handler(req, res)

                if (response instanceof Stream) {
                    response
                        .on('error', error => {
                            this.app.handler.error(error, req, res)
                        })
                        .pipe(res)
                } else {
                    res.send(response).end()
                }
            } catch (error) {
                this.app.handler.error(error, req, res)
            }
        })
    }
}

module.exports = Router
