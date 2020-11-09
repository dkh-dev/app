'use strict'

const { Stream } = require('stream')

const HttpMethod = require('./utils/http-method')
const HttpError = require('./utils/http-error')
const each = require('./utils/each')
const { array, buffer, string } = require('./utils/is')
const { parsers } = require('./utils/parser')

const Logger = require('./logger')
const Db = require('./db')
const Key = require('./key')
const Router = require('./router')
const Validator = require('./validator')
const Request = require('./request')
const Response = require('./response')
const config = require('./config')
const server = require('./server')


class App {
  constructor(conf) {
    this.config = config(conf)

    const {
      server: { max_body_size: limit },
      logger,
      database,
      key,
      validator,
    } = this.config

    this.logger = new Logger(logger)
    this.db = new Db(database)
    this.key = new Key(key, { db: this.db })
    this.validator = new Validator(validator)
    this.router = new Router()

    this.listener = this.listener.bind(this)
    this.authenticate = this.authenticate.bind(this)

    each(parsers, (parser, name) => {
      this[ name ] = parser({ limit })
    })
  }

  /**
   * Requires authentication keys to unlock.
   *
   * Example:
   * ```
   * app.lock([
   *   '/admin',
   * ])
   * ```
   *
   * @param {string[]} paths
   */
  lock(paths) {
    paths.forEach(path => this.use({ [ path ]: this.authenticate }))
  }

  /**
   * Registers middlewares.
   *
   * Example:
   * ```
   * app.use({
   *   '/': [ bodyParser, accessLog ],
   *   '/admin': auth,
   * })
   * ```
   *
   * @param {object} middlewares
   */
  use(middlewares) {
    each(middlewares, (m, p) => {
      const middlewares = array(m) ? m : [ m ]

      middlewares.forEach(m => this.router.use(p, m))
    })

    return this
  }

  /**
   * Defines schemas or registers validator middlewares.
   *
   * Example:
   * ```
   * app.schema({
   *   // definitions
   *
   *   story: {
   *     definitions: {
   *       id: { type: 'string', maxLength: 20 },
   *       contents: { type: 'string', maxLength: 1000 },
   *     },
   *   },
   *
   *   // validator middlewares
   *   // keys starting with '/' are paths
   *
   *   '/duplicate': {
   *     type: 'array',
   *     items: { type: 'integer' },
   *   },
   *
   *   '/stories/create': {
   *     type: 'object',
   *     properties: {
   *       contents: { ref: 'story#/definitions/contents' },
   *     },
   *     additionalProperties: false,
   *   },
   * })
   * ```
   *
   * @param {object} schema
   */
  schema(schema) {
    const entries = Object.entries(schema)

    const defs = entries.filter(([ key ]) => !key.startsWith('/'))
    const paths = entries.filter(([ key ]) => key.startsWith('/'))

    defs.forEach(([ id, schema ]) => this.validator.add(id, schema))

    paths.forEach(([ path, schema ]) => {
      const validate = this.validator.compile(schema)
      const validator = ({ body }) => validate(body)

      this.use({ [ path ]: validator })
    })
  }

  /**
   * @private
   */
  handler(method, handlers) {
    each(handlers, (h, p) => this.router.handler(method, p, h))

    return this
  }

  /**
   * @private
   */
  async handle(request, response) {
    await this.router.middle(request, response)

    if (response.finished) {
      return
    }

    const found = await this.router.handle(request, response)

    if (response.finished) {
      return
    }

    if (!found) {
      return void response.status(404).end()
    }

    await this.router.after(request, response)

    if (response.finished) {
      return
    }

    let { body } = response

    if (body === null || body === void 0) {
      return void response.end()
    }

    if (body instanceof Stream) {
      const error = err => this.onerror(err, request, response)

      return void body.on('error', error).pipe(response.res)
    }

    if (!string(body) && !buffer(body)) {
      body = JSON.stringify(body)
    }

    response.end(body)
  }

  authenticate(request, response) {
    return this.key.authenticate(request, response)
  }

  async listener(req, res) {
    const request = new Request(req)
    const response = new Response(res)

    try {
      await this.handle(request, response)
    } catch (err) {
      this.onerror(err, request, response)
    }
  }

  /**
   * Error handler.
   * @param {Error} err
   * @param {Request} request
   * @param {Response} response
   */
  onerror(err, request, response) {
    this.logger.error(err)

    if (response.finished) {
      return
    }

    const status = err instanceof HttpError ? err.status : 400

    response.status(status).end()
  }

  async start() {
    const { config: { server: { port } }, logger, db } = this

    await Promise.all([
      logger.start(),
      db.connect(),
      this.listen(),
    ])

    logger.info(`http://localhost:${ port }`)
  }

  async listen() {
    const { config: { server: options }, listener } = this
    const { port } = options

    if (!port) {
      throw Error('server port must be specified')
    }

    this.server = await server(listener, options)
  }

  close() {
    this.logger.close()
    this.db.close()
    this.server?.close?.()
  }
}

each(HttpMethod, (method, name) => {
  App.prototype[ name ] = function (handlers) {
    this.handler(method, handlers)

    return this
  }
})

module.exports = App
