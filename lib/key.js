'use strict'

const { randomBytes, hash: { sha256 } } = require('@dkh-dev/crypto')

const KeyValueStore = require('./utils/key-value-store')
const HttpError = require('./utils/http-error')
const defineLazyProperty = require('./utils/define-lazy-property')


/**
 * Authenticates requests with authentication keys.
 *
 * Example:
 * ```
 * const key = new Key(config, { db })
 *
 * app.use(key.authenticate)
 * ```
 * ```
 * const key = new Key(config, {
 *   store: new KeyValueStore(db.keys),
 *   cache: new Map(),
 * })
 *
 * app.use(key.authenticate)
 * ```
 *
 * _Note_: `store` and `cache` must have `get()` and `set()` methods.
 */
class Key {
  constructor(config, stores) {
    this.config = config
    this.stores = stores
  }

  // authentication methods

  /**
   * @param {Request} request
   */
  async authenticate(request) {
    const { path, headers: { authorization } } = request

    try {
      await this.verify(authorization, path)
    } catch (err) {
      throw new HttpError(401, err.message)
    }
  }

  /**
   * @param {string} key
   * @param {string} path
   */
  async verify(key, path) {
    if (!key) {
      throw Error('key is empty')
    }

    const info = await this.find(key)

    if (!info) {
      throw Error(`invalid key ${ key.slice(0, 15) }`)
    }

    // 'match()' can be overriden to be async
    const match = await this.match(info.scopes, path)

    if (!match) {
      throw Error(`invalid key ${ key.slice(0, 5) } scope ${ path }`)
    }
  }

  /**
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  match(scopes, path) {
    for (let i = 0; i < scopes.length; i++) {
      const s = scopes[ i ]

      // matches exact scope or sub-scope
      if (path === s || path.startsWith(s.endsWith('/') ? s : `${ s }/`)) {
        return true
      }
    }

    return false
  }

  /**
   * @param {string} key
   */
  async find(key) {
    const { config: { size, encoding }, store, cache } = this
    const cached = await cache.get(key)

    if (cached) {
      return cached
    }

    const buffer = Buffer.from(key, encoding)
    const { length } = buffer

    // invalidates all keys if key size config changes
    if (length !== size) {
      throw Error(`invalid key ${ key.slice(0, 15) } of size ${ length }`)
    }

    const hash = await sha256(buffer)
    const info = await store.get(hash)

    await cache.set(key, info)

    return info
  }

  // management methods

  /**
   * @param {string[]} scopes
   * @param {object} data
   * @param {string} data.comment
   */
  async generate(scopes, data = {}) {
    const { config: { size, encoding }, store } = this

    const buffer = await randomBytes(size)
    const hash = await sha256(buffer)
    const key = buffer.toString(encoding)

    const { comment } = data
    const info = {
      scopes,
      comment,
      createdAt: new Date(),
    }

    await store.set(hash, info)

    return key
  }
}

// if store is not provided, `Key` uses collection 'keys' to as key store
// lazy store allows such `db.connect()` after `new Key()` behaviour
defineLazyProperty(Key.prototype, 'store', {
  get() {
    const { config, stores: { store, db } } = this

    return store || new KeyValueStore(db[ config.collection_name ])
  },
})

// if cache store is not provided, `Key` uses a `Map` as cache store
defineLazyProperty(Key.prototype, 'cache', {
  get() {
    const { stores: { cache } } = this

    return cache || new Map()
  },
})

module.exports = Key
