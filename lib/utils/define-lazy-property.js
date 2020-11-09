'use strict'

const defineLazyProperty = (obj, prop, { get, ...attr }) => {
  Object.defineProperty(obj, prop, {
    get() {
      this[ prop ] = get.call(this)

      return this[ prop ]
    },
    set(value) {
      Object.defineProperty(this, prop, { value, ...attr })
    },
    ...attr,
    configurable: true,
  })
}

module.exports = defineLazyProperty
