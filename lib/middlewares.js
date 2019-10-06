'use strict'

const express = require('express')

const ExtendedMap = require('@dkh-dev/extended-map')


class Middlewares {
    constructor(app) {
        this.app = app

        this.wrappers = new ExtendedMap()
    }

    activate() {
        const {
            config: { server: { post_max_size } },
            settings: { middlewares, routes: { post } },
        } = this.app

        if (post) {
            const paths = Object.keys(post)
            const json = express.json({ limit: post_max_size })

            paths.forEach(path => this.mount(path, json))
        }

        this.use(middlewares)

        this.mount('/', this.app.handler.error)
    }

    use(middlewares) {
        const entries = Object.entries(middlewares)

        entries.forEach(([ path, middlewares ]) => {
            this.mountMany(path, middlewares)
        })
    }

    mountMany(path, middlewares) {
        middlewares.forEach(middleware => this.mount(path, middleware))
    }

    mount(path, middleware) {
        const wrapper = this.wrap(middleware)

        if (path === '/' || path === '/*') {
            return void this.app.express.use(wrapper)
        }

        this.app.express.use(path, wrapper)
    }

    wrap(middleware) {
        if (middleware.length >= 3) {
            return middleware
        }

        return this.wrappers.get(middleware, () => async (req, res, next) => {
            try {
                await middleware(req, res)

                return void next()
            } catch (error) {
                this.app.handler.error(error, req, res)
            }
        })
    }
}

module.exports = Middlewares
