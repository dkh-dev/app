'use strict'

const { randomBytes, hash: { sha256 } } = require('@dkh-dev/crypto')
const ExtendedMap = require('@dkh-dev/extended-map')

const HttpError = require('./http-error')


/**
 * Authenticates requests using authentication keys. The request's path
 *   must equal to or be a sub-path of one of the key's granted scopes.
 *
 * Notice: Keys are cached in memory for the app's lifetime.
 */
class Key {
  constructor(app) {
    this.app = app

    this.keys = new ExtendedMap()

    this.authenticate = async req => {
      const { originalUrl, headers: { authorization } } = req

      try {
        await this.verify(authorization, originalUrl)
      } catch (error) {
        throw new HttpError(401, error.message)
      }
    }
  }

  activate() {
    const { db, settings: { routes: { locked } }, middlewares } = this.app

    if (!db) {
      throw Error('app keys require a database')
    }

    if (locked) {
      locked.forEach(path => {
        middlewares.mount(path, this.authenticate)
      })
    }
  }

  async verify(key, path) {
    const data = await this.keys.get(key, () => this.find(key))
    const { scopes, comment } = data

    if (!scopes.some(scope => this.constructor.granted(path, scope))) {
      throw Error(`invalid key ${ comment || key.slice(0, 3) } scope ${ path }`)
    }
  }

  async find(key) {
    const buffer = this.buffer(key)
    const hash = await sha256(buffer)

    const data = await this.app.db.keys.findOne(
      { _id: hash },
      {
        projection: {
          _id: 0,
          scopes: 1,
          comment: 1,
        },
      },
    )

    if (!data) {
      throw Error(`invalid key ${ key }`)
    }

    return data
  }

  buffer(key) {
    const { size, encoding } = this.app.config.key

    const buffer = Buffer.from(key, encoding)
    const { length } = buffer

    if (length !== size) {
      throw Error(`key size of ${ length } is invalid`)
    }

    return buffer
  }

  async generate({ scopes, comment }) {
    const { buffer, string } = await this.generateOnly()
    const hash = await sha256(buffer)

    await this.app.db.keys.insertOne({ _id: hash, scopes, comment })

    return string
  }

  async generateOnly() {
    const { size, encoding } = this.app.config.key

    const buffer = await randomBytes(size)
    const string = buffer.toString(encoding)

    return { buffer, string }
  }

  /**
   * Check if the current path is granted permission by this scope.
   */
  static granted(path, scope) {
    const sub = scope.endsWith('/') ? scope : `${ scope }/`

    return path === scope || path.startsWith(sub)
  }
}

module.exports = Key
