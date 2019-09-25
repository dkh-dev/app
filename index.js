'use strict'

const fs = require('fs')

const express = require('express')
const yaml = require('js-yaml')

const Db = require('./lib/db')
const logger = require('./lib/logger')
const createServer = require('./lib/create-server')
const errorHandler = require('./lib/error-handler')
const Authentication = require('./lib/authentication')
const Middlewares = require('./lib/middlewares')
const Router = require('./lib/router')


class App {
    constructor(configFile) {
        this.config = yaml.safeLoad(fs.readFileSync(configFile))

        this.app = express()
            .use(express.json({ limit: this.config.server.post_max_size }))
            .use(errorHandler)
        this.middlewares = new Middlewares(this.app)
        this.router = new Router(this.app)
        this.db = Db.initialize(this.config.database)
        this.authentication = new Authentication(this)
        this.logger = logger

        this.settings = {
            routes: {},
        }
    }

    use(middlewares) {
        this.settings.middlewares = middlewares

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
        this.app.set(name, value)

        return this
    }

    disable(setting) {
        this.app.disable(setting)

        return this
    }

    async initialize() {
        this.addLoggers()

        if (this.config.database) {
            await this.db.connect()
        }
    }

    addLoggers() {
        const { server: { access_log, error_log } } = this.config

        logger.add({ level: 'error', filename: error_log })
        logger.add({ level: 'info', filename: access_log })
    }

    finalize() {
        const { middlewares, routes: { get, post } } = this.settings

        if (middlewares) {
            this.middlewares.use(middlewares)
        }

        if (get) {
            this.router.defineRoutes('get', get)
        }

        if (post) {
            this.router.defineRoutes('post', post)
        }
    }

    async start() {
        await this.initialize()
        this.finalize()

        const { server: {
            port,
            ssl_port,
            ssl_certificate,
            ssl_certificate_key,
        } } = this.config

        createServer(this.app, { port })

        if (!ssl_port) {
            return
        }

        createServer(this.app, {
            port: ssl_port,
            certificate: ssl_certificate,
            certificateKey: ssl_certificate_key,
        })
    }
}

module.exports = App
