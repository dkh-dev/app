'use strict'

const express = require('express')

const ExtendedMap = require('@dkh-dev/extended-map')


class Middlewares {
  constructor(app) {
    this.app = app

    this.middlewares = new ExtendedMap()
  }

  activate() {
    const {
      config: {
        server: { post_max_size: limit },
      },
      settings: {
        middlewares,
        routes: { post },
      },
      handlers,
    } = this.app

    // apply body parsers
    if (post) {
      const paths = Object.keys(post)

      const raw = express.raw({ limit })
      const json = express.json({ limit })

      paths.forEach(path => this.mountMany(path, [ raw, json ]))
    }

    this.apply(middlewares)

    // apply post-request handlers
    this.mount('/', handlers.error)
  }

  apply(middlewares) {
    const entries = Object.entries(middlewares)

    entries.forEach(([ path, middleware ]) => {
      if (middleware.forEach) {
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
