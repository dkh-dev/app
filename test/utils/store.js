'use strict'

class Store extends Map {
  get(key) {
    return Promise.resolve(super.get(JSON.stringify(key)))
  }

  set(key, value) {
    return Promise.resolve(super.set(JSON.stringify(key), value))
  }
}

module.exports = Store
