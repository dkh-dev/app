'use strict'

/**
 * Converts express-compatible middleware to app-compatible middleware.
 * @param {function} fn
 */
const convert = fn => ({ req }, { res }) => new Promise((resolve, reject) => {
  const next = err => {
    if (err) {
      reject(err)
    } else {
      resolve()
    }
  }

  fn(req, res, next)
})

module.exports = convert
