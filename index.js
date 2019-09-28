'use strict'

const express = require('express')

const config = require('./lib/config')
const Db = require('./lib/db')
const Logger = require('./lib/logger')
const Servers = require('./lib/servers')
const Handler = require('./lib/handler')
const Authentication = require('./lib/authentication')
const Middlewares = require('./lib/middlewares')
const Router = require('./lib/router')


class App {
    constructor() {
        this.config = config

        this.settings = {
            middlewares: {},
            routes: {},
        }

        this.logger = new Logger(config.logger)
        this.handler = new Handler(this.logger)
        this.db = new Db(config.database)
        this.authentication = new Authentication(this)
        this.middlewares = new Middlewares(this)
        this.router = new Router(this)
        this.servers = new Servers(this)

        this.express = express()
            .use(express.json({ limit: config.server.post_max_size }))
            .use(this.handler.error)
    }

    use(middlewares) {
        this.settings.middlewares = middlewares

        return this
    }

    secure(routes) {
        this.settings.routes.secured = routes

        return this
    }

    get(routes) {
        this.settings.routes.get = routes

        return this
    }

    post(routes) {
        this.settings.routes.post = routes

        return this
    }

    set(name, value) {
        this.express.set(name, value)

        return this
    }

    disable(setting) {
        this.express.disable(setting)

        return this
    }

    finalize() {
        const { middlewares, routes: { get, post, secured } } = this.settings

        if (secured) {
            const { authenticate } = this.authentication

            secured.forEach(route => {
                if (!middlewares[ route ]) {
                    middlewares[ route ] = []
                }

                if (!middlewares[ route ].includes(authenticate)) {
                    middlewares[ route ].push(authenticate)
                }
            })
        }

        this.middlewares.use(middlewares)

        if (get) {
            this.router.route('get', get)
        }

        if (post) {
            this.router.route('post', post)
        }

        return this
    }

    shutdown() {
        this.servers.shutdown()
        this.db.close()
        this.logger.close()
    }

    async start() {
        const { database, server } = config

        if (!server) {
            return
        }

        this.finalize()

        if (database) {
            await this.db.connect()
        }

        this.servers.start()
    }
}

module.exports = App
