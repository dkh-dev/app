'use strict'

const { readFileSync } = require('fs')
const http = require('http')
const https = require('https')


class Servers {
  constructor(app) {
    this.app = app
  }

  start() {
    const {
      config: {
        server: {
          port,
          ssl_port,
          ssl_certificate,
          ssl_certificate_key,
          keep_alive_timeout,
        },
      },
    } = this.app

    if (port) {
      this.http = this.server({
        port,
        keepAliveTimeout: keep_alive_timeout,
      })
    }

    if (ssl_port && ssl_certificate && ssl_certificate_key) {
      this.https = this.server({
        port: ssl_port,
        certificate: ssl_certificate,
        certificateKey: ssl_certificate_key,
        keepAliveTimeout: keep_alive_timeout,
      })
    }
  }

  shutdown() {
    const { logger } = this.app

    logger.info('servers shutting down')

    if (this.http) {
      this.http.close()
    }

    if (this.https) {
      this.https.close()
    }
  }

  server({ certificate, certificateKey, ...options }) {
    if (!certificate || !certificateKey) {
      return this.boot(options)
    }

    const cert = readFileSync(certificate)
    const key = readFileSync(certificateKey)
    const ssl = { cert, key }

    return this.boot(options, ssl)
  }

  boot(options, ssl = null) {
    const { port, keepAliveTimeout } = options
    const { express, logger } = this.app

    const server = ssl
      ? https.createServer(ssl, express)
      : http.createServer(express)

    server.keepAliveTimeout = keepAliveTimeout

    return server.listen(
      port,
      () => {
        const address = `${ ssl ? 'https' : 'http' }://localhost:${ port }/`

        logger.info(`active on ${ address }`)
      },
    )
  }
}

module.exports = Servers
