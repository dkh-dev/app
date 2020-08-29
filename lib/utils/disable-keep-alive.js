'use strict'

const disableKeepAlive = (req, res) => {
  res.shouldKeepAlive = false
}

module.exports = disableKeepAlive
