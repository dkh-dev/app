'use strict'

const map = (obj, callback) => {
  const result = {}

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const [ k = key, v ] = callback(obj[ key ], key)

      result[ k ] = v
    }
  }

  return result
}

module.exports = map
