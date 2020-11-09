'use strict'

/**
 * MongoDB collection as a key-value store.
 */
class KeyValueStore {
  constructor(collection) {
    this.collection = collection
  }

  /**
   * @type {Promise<number>}
   */
  get size() {
    return this.collection.countDocuments()
  }

  async get(key) {
    const query = { _id: key }
    const options = { projection: { _id: 0 } }

    const document = await this.collection.findOne(query, options)

    return document ? document.value : void 0
  }

  set(key, value) {
    const filter = { _id: key }
    const update = { $set: { value } }
    const options = { upsert: true }

    return this.collection.updateOne(filter, update, options)
  }

  async has(key) {
    const query = { _id: key }
    const options = { limit: 1 }

    return await this.collection.countDocuments(query, options) === 1
  }

  delete(key) {
    const query = { _id: key }

    return this.collection.deleteOne(query)
  }

  keys() {
    const query = {}
    const options = { projection: { _id: 1 } }

    return this.collection.find(query, options).map(({ _id }) => _id).toArray()
  }

  clear() {
    return this.collection.deleteMany()
  }
}


module.exports = KeyValueStore
