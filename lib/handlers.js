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

    this.error = this.error.bind(this)
  }

  /**
   * Applies necessary handlers to an existing middleware.
   */
  middleware(middleware) {
    if (middleware.length === 4) {
      return middleware
    }

    return this.middlewares.get(
      middleware,
      () => async (req, res, next) => {
        try {
          if (middleware.length === 3) {
            return void await middleware(req, res, next)
          }

          await middleware(req, res)

          return void next()
        } catch (error) {
          next(error)
        }
      },
    )
  }

  /**
   * Applies necessary handlers to an existing handler.
   */
  handler(handler) {
    return this.handlers.get(
      handler,
      () => async (req, res) => {
        const next = error => {
          if (error) {
            return void this.error(error, req, res)
          }

          res.end()
        }

        try {
          if (handler.length === 3) {
            return void await handler(req, res, next)
          }

          const data = await handler(req, res)

          if (data instanceof Stream) {
            data
              .on('error', next)
              .pipe(res)
          } else {
            res
              .send(typeof data === 'number' ? String(data) : data)
              .end()
          }
        } catch (error) {
          next(error)
        }
      },
    )
  }

  // this method must have the 4th argument so that it can function as
  //   an error handler
  // eslint-disable-next-line no-unused-vars
  error(error, req, res, next) {
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

module.exports = Handlers
