'use strict'

const { createServer } = require('http')


const server = (listener, options) => {
  const { port, keep_alive_timeout: keepAliveTimeout } = options

  const server = createServer(listener)

  server.keepAliveTimeout = keepAliveTimeout

  return new Promise(resolve => server.listen(port, () => resolve(server)))
}

module.exports = server
