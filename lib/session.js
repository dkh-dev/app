'use strict'

const session = require('express-session')


class Session {
    constructor(app) {
        this.app = app
    }

    activate() {
        const { middlewares, config, settings: { routes } } = this.app

        if (!config.session || !config.session.secret) {
            return
        }

        const middleware = session(config.session)

        if (routes.session) {
            routes.session.forEach(path => middlewares.mount(path, middleware))
        }
    }
}

module.exports = Session
