'use strict'

const HttpMethod = require('./utils/http-method')
const { callable } = require('./utils/is')
const { matcher } = require('./utils/matcher')
const map = require('./utils/map')


const stack = () => ({ callback: [], match: [] })

class Router {
  constructor() {
    this.middlewares = stack()
    this.handlers = map(HttpMethod, method => [ method, stack() ])
  }

  /**
   * Loops through the middlewares that matches the request.
   *
   * Sets `response.after` to an array of after-response callback.
   *
   * @param {Request} request
   * @param {Response} response
   */
  async middle(request, response) {
    const { path } = request
    const { callback, match } = this.middlewares
    const after = []

    for (let i = 0; i < match.length; i++) {
      const params = match[ i ](path)

      if (!params) {
        continue
      }

      request.params = params

      const fn = await callback[ i ](request, response)

      if (response.finished) {
        return
      }

      if (callable(fn)) {
        after.push(fn)
      }
    }

    response.after = after
  }

  /**
   * Invokes the first handler that matches the request.
   *
   * Sets `response.body` to the return value of the handler.
   *
   * @param {Request} request
   * @param {Response} response
   */
  async handle(request, response) {
    const { method, path } = request
    const { callback, match } = this.handlers[ method ]

    for (let i = 0; i < match.length; i++) {
      const params = match[ i ](path)

      if (!params) {
        continue
      }

      request.params = params

      response.body = await callback[ i ](request, response)

      return true
    }

    return false
  }

  // eslint-disable-next-line class-methods-use-this
  async after(request, response) {
    const { after } = response

    for (let i = after.length - 1; i >= 0; i--) {
      await after[ i ](request, response)
    }
  }

  use(path, middleware, exact = false) {
    const { callback, match } = this.middlewares
    const m = matcher(path, exact)

    callback.push(middleware)
    match.push(m)
  }

  handler(method, path, handler) {
    const { callback, match } = this.handlers[ method ]
    const m = matcher(path)

    callback.push(handler)
    match.push(m)
  }
}

module.exports = Router
