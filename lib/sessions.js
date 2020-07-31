'use strict'

let session

try {
  session = require('express-session')
} catch (error) {
  session = null
}


class Sessions {
  constructor(app) {
    this.app = app

    if (this.app.config.session && !session) {
      throw Error('missing peer dependency express-session')
    }
  }

  activate() {
    const {
      config: { session: config },
      settings: { routes: { session: routes } },
      middlewares,
    } = this.app

    if (!config || !routes) {
      return
    }

    const {
      secret,
      name,
      resave,
      save_uninitialized,
      cookie: {
        max_age,
        secure,
        signed,
        path,
        domain,
        http_only,
        same_site,
      },
    } = config

    if (!secret) {
      return
    }

    const middleware = session({
      secret,
      name,
      resave,
      saveUninitialized: save_uninitialized,
      cookie: {
        secure,
        signed,
        path,
        domain,
        maxAge: max_age,
        httpOnly: http_only,
        sameSite: same_site,
      },
    })

    routes.forEach(path => middlewares.mount(path, middleware))
  }
}

module.exports = Sessions
