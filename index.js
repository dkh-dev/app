'use strict'

const express = require('express')

const config = require('./lib/config')
const Db = require('./lib/db')
const Logger = require('./lib/logger')
const Servers = require('./lib/servers')
const Handler = require('./lib/handler')
const Key = require('./lib/key')
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
        this.key = new Key(this)
        this.middlewares = new Middlewares(this)
        this.router = new Router(this)
        this.servers = new Servers(this)

        this.express = express()
    }

    use(middlewares) {
        this.settings.middlewares = middlewares

        return this
    }

    lock(routes) {
        this.settings.routes.locked = routes

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
        this.express.disable('x-powered-by')

        this.key.activate()
        this.middlewares.activate()
        this.router.activate()
    }

    shutdown() {
        this.servers.shutdown()
        this.db.close()
        this.logger.close()
    }

    async start() {
        this.finalize()

        await this.db.connect()

        this.servers.start()
    }
}

module.exports = App
