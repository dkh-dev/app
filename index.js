'use strict'

const express = require('express')

const config = require('./lib/config')
const Db = require('./lib/db')
const Logger = require('./lib/logger')
const Servers = require('./lib/servers')
const Handler = require('./lib/handler')
const Key = require('./lib/key')
const Session = require('./lib/session')
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
        this.db = new Db(config.database)
        this.key = new Key(this)

        this.express = express().disable('x-powered-by')
    }

    use(middlewares) {
        this.settings.middlewares = middlewares

        return this
    }

    lock(paths) {
        this.settings.routes.locked = paths

        return this
    }

    session(paths) {
        this.settings.routes.session = paths
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
        this.handler = new Handler(this.logger)
        this.session = new Session(this)
        this.middlewares = new Middlewares(this)
        this.router = new Router(this)
        this.servers = new Servers(this)

        this.key.activate()
        this.middlewares.activate()
    }

    shutdown() {
        this.servers.shutdown()
        this.db.close()
        this.logger.close()
    }

    async start() {
        this.finalize()

        await this.db.connect()

        this.session.activate()
        this.router.activate()

        this.servers.start()
    }
}

module.exports = App
