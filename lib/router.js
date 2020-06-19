'use strict'


class Router {
  constructor(app) {
    this.app = app
  }

  activate() {
    const { settings: { routes: { get, post } } } = this.app

    if (get) {
      this.route('get', get)
    }

    if (post) {
      this.route('post', post)
    }
  }

  route(method, routes) {
    const name = method.toString().toLowerCase()
    const entries = Object.entries(routes)

    entries.forEach(([ path, handler ]) => {
      this.mount(name, path, handler)
    })
  }

  mount(name, path, handler) {
    const { handlers, express } = this.app
    const callback = handlers.handler(handler)

    express[ name ](path, callback)
  }
}

module.exports = Router
