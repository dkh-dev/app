'use strict'

const { Stream } = require('stream')

const ExtendedMap = require('@dkh-dev/extended-map')

const HttpError = require('./http-error')


/**
 * Applies necessary handlers for the app to run without errors.
 */
class Handlers {
  constructor(app) {
    this.app = app

    this.middlewares = new ExtendedMap()
    this.handlers = new ExtendedMap()

    // this method must have the 4th argument so that it can function as
    //   an error handler
    // eslint-disable-next-line no-unused-vars
    this.error = (error, req, res, next) => {
      const { logger } = this.app

      try {
        logger.error(error)

        if (!res) {
          return
        }

        res.status(error instanceof HttpError ? error.code : 400)
      } catch (error) {
        logger.error(error)

        res.status(400)
      } finally {
        res.end()
      }
    }
  }

  /**
   * Applies necessary handlers to an existing middleware.
   */
  middleware(middleware) {
    if (middleware.length >= 3) {
      return middleware
    }

    return this.middlewares.get(middleware, () => async (req, res, next) => {
      try {
        await middleware(req, res)

        return void next()
      } catch (error) {
        this.error(error, req, res)
      }
    })
  }

  /**
   * Applies necessary handlers to an existing handler.
   */
  handler(handler) {
    return this.handlers.get(handler, () => async (req, res) => {
      const next = error => this.error(error, req, res)

      if (handler.length >= 3) {
        return void handler(req, res, next)
      }

      try {
        const response = await handler(req, res)

        if (response instanceof Stream) {
          response.on('error', next).pipe(res)
        } else {
          res.send(response).end()
        }
      } catch (error) {
        next(error)
      }
    })
  }
}

module.exports = Handlers
