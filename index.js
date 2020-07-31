'use strict'

const express = require('express')

const config = require('./lib/config')
const Db = require('./lib/db')
const Logger = require('./lib/logger')
const Servers = require('./lib/servers')
const Handlers = require('./lib/handlers')
const Key = require('./lib/key')
const Sessions = require('./lib/sessions')
const Middlewares = require('./lib/middlewares')
const Router = require('./lib/router')
const Assets = require('./lib/assets')


class App {
  constructor() {
    this.config = config

    this.settings = {
      middlewares: {},
      routes: {},
    }

    this.initialize()
  }

  use(middlewares) {
    this.settings.middlewares = middlewares

    return this
  }

  /**
   * Locks paths. Requires authentication keys to unlock.
   */
  lock(paths) {
    this.settings.routes.locked = paths

    return this
  }

  /**
   * Enables sessions for paths.
   */
  session(paths) {
    this.settings.routes.session = paths

    return this
  }

  /**
   * Serves assets.
   */
  static(options) {
    this.settings.routes.assets = options

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

  initialize() {
    this.logger = new Logger(config.logger)
    this.db = new Db(config.database)
    this.key = new Key(this)

    this.express = express()

    return this
  }

  finalize() {
    this.handlers = new Handlers(this)
    this.assets = new Assets(this)
    this.sessions = new Sessions(this)
    this.middlewares = new Middlewares(this)
    this.router = new Router(this)
    this.servers = new Servers(this)

    this.express.disable('x-powered-by')

    return this
  }

  async start() {
    this.finalize()

    await this.db.connect()
    this.key.activate()
    this.assets.activate()
    this.sessions.activate()
    this.middlewares.activate()
    this.router.activate()
    await this.servers.start()

    return this
  }

  shutdown() {
    this.servers.shutdown()
    this.db.close()
    this.logger.close()

    return this
  }
}

module.exports = App
