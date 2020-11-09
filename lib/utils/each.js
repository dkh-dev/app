'use strict'

const each = (obj, callback) => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      callback(obj[ key ], key)
    }
  }
}

module.exports = each
