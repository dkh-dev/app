'use strict'

const express = require('express')

const config = require('./lib/config')
const Db = require('./lib/db')
const Logger = require('./lib/logger')
const Servers = require('./lib/servers')
const Handlers = require('./lib/handlers')
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
  sessions(paths) {
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

  initialize() {
    this.logger = new Logger(config.logger)
    this.db = new Db(config.database)
    this.key = new Key(this)

    this.express = express().disable('x-powered-by')
  }

  finalize() {
    this.handlers = new Handlers(this)
    this.session = new Session(this)
    this.middlewares = new Middlewares(this)
    this.router = new Router(this)
    this.servers = new Servers(this)
  }

  async start() {
    await this.db.connect()

    this.finalize()

    this.key.activate()
    this.session.activate()
    this.middlewares.activate()
    this.router.activate()
    this.servers.start()
  }

  shutdown() {
    this.servers.shutdown()
    this.db.close()
    this.logger.close()
  }
}

module.exports = App
