'use strict'

const MongoClient = (() => {
  try {
    const { MongoClient } = require('mongodb')

    return MongoClient
  } catch (error) {
    return null
  }
})()

/**
 * Example:
 * ```
 * db.stories.insertOne({ _id: id, ...data })
 * db.stories.updateOne({ _id: id }, { $set: { title } })
 * db.stories.deleteOne({ _id })
 * ```
 */
class Db {
  constructor(config) {
    this.config = config

    // enables command-line-style access to collections like `db.keys.findOne()`
    return new Proxy(this, {
      get: (db, prop) => {
        if (prop in db) {
          return db[ prop ]
        }

        if (!db.hasOwnProperty('db')) {
          throw Error('db not connected')
        }

        const collection = db.db.collection(prop)

        db[ prop ] = collection

        return collection
      },
    })
  }

  async connect() {
    const {
      user,
      password,
      hostname,
      port,
      name,
      authentication_database: authSource,
      pool_size: poolSize,
      min_size: minSize,
      ignore_undefined: ignoreUndefined,
    } = this.config

    if (!user || !password) {
      return
    }

    if (!MongoClient) {
      throw Error('missing peer dependency mongodb')
    }

    const url = `mongodb://${ hostname }:${ port }/`
    const options = {
      auth: { user, password },
      authSource,
      poolSize,
      minSize,
      ignoreUndefined,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      validateOptions: true,
    }
    const client = new MongoClient(url, options)

    await client.connect()

    this.client = client
    this.db = client.db(name)
  }

  close() {
    this.client?.close?.()
  }
}

module.exports = Db
