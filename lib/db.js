'use strict'

const ExtendedMap = require('@dkh-dev/extended-map')

let mongodb

try {
  mongodb = require('mongodb')
} catch (error) {
  mongodb = {}
}

const { MongoClient } = mongodb


class Db {
  constructor(config) {
    this.config = config

    if (this.config && !MongoClient) {
      throw Error('missing peer dependency mongodb')
    }

    /**
     * Proxied collections.
     */
    this.collections = new ExtendedMap()

    return this.proxied()
  }

  async connect() {
    if (!this.config) {
      return
    }

    const {
      hostname,
      port,
      name,
      user,
      password,
      authentication_database,
      pool_size,
      min_size,
      ignore_undefined,
    } = this.config

    const auth = user && password ? `${ user }:${ password }@` : ''
    const authSource = authentication_database
      ? `?authSource=${ authentication_database }`
      : ''
    const url = `mongodb://${ auth }${ hostname }:${ port }/${ authSource }`

    this.client = new MongoClient(url, {
      poolSize: pool_size,
      minSize: min_size,
      ignoreUndefined: ignore_undefined,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    await this.client.connect()

    this.db = this.client.db(name)
  }

  /**
   * @private
   * Enables command-line style access to collections, such as:
   *   `db.keys.findOne()`.
   */
  proxied() {
    return new Proxy(this, {
      get: (db, property) => {
        if (property in db) {
          return db[ property ]
        }

        db[ property ] = this.collection(property)

        return db[ property ]
      },
    })
  }

  /**
   * @private
   * Allows collections to be passed as reference at parse-time.
   */
  collection(name) {
    return this.collections.get(
      name,
      // proxy through an anonymous object
      // the object has the property `name` the make debugging easier
      () => new Proxy({ name }, {
        get: (target, method) => {
          const collection = this.collections.get(
            target,
            () => this.db.collection(name),
          )

          return collection[ method ]
        },
      }),
    )
  }

  close() {
    if (this.client) {
      this.client.close()
    }
  }
}

module.exports = Db
