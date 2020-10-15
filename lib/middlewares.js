'use strict'

const express = require('express')
const disableKeepAlive = require('./utils/disable-keep-alive')


class Middlewares {
  constructor(app) {
    this.app = app
  }

  activate() {
    const {
      config: {
        server: {
          post_max_size: limit,
          keep_alive_timeout: keepAliveTimeout,
        },
      },
      settings: {
        middlewares,
        routes: { post },
      },
      handlers,
    } = this.app

    if (keepAliveTimeout === 0) {
      this.mount('/', disableKeepAlive)
    }

    // apply body parsers
    if (post) {
      const paths = Object.keys(post)

      const json = express.json({ limit })

      paths.forEach(path => this.mountMany(path, [ json ]))
    }

    this.apply(middlewares)

    // apply post-request handlers
    this.mount('/', handlers.error)
  }

  apply(middlewares) {
    middlewares.forEach(([ path, middleware ]) => {
      if (Array.isArray(middleware)) {
        this.mountMany(path, middleware)
      } else {
        this.mount(path, middleware)
      }
    })
  }

  mount(path, middleware) {
    const { handlers, express } = this.app
    const callback = handlers.middleware(middleware)

    if (path === '/' || path === '/*') {
      express.use(callback)
    } else {
      express.use(path, callback)
    }
  }

  mountMany(path, middlewares) {
    middlewares.forEach(middleware => this.mount(path, middleware))
  }
}

module.exports = Middlewares
