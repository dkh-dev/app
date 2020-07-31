'use strict'

const { readFileSync } = require('fs')
const http = require('http')
const https = require('https')


class Servers {
  constructor(app) {
    this.app = app
  }

  async start() {
    const {
      config: {
        server: {
          port,
          ssl_port,
          ssl_certificate,
          ssl_certificate_key,
        },
      },
    } = this.app

    const servers = []

    if (port) {
      servers[ 0 ] = this.server({
        port,
      })
    }

    if (ssl_port && ssl_certificate && ssl_certificate_key) {
      servers[ 1 ] = this.server({
        port: ssl_port,
        certificate: ssl_certificate,
        certificateKey: ssl_certificate_key,
      })
    }

    const [ http, https ] = await Promise.all(servers)

    this.http = http
    this.https = https
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
      return this.create(options)
    }

    const cert = readFileSync(certificate)
    const key = readFileSync(certificateKey)
    const ssl = { cert, key }

    return this.create(options, ssl)
  }

  create(options, ssl = null) {
    const { port } = options
    const {
      config: { server: { keep_alive_timeout: keepAliveTimeout } },
      express,
      logger,
    } = this.app

    const server = ssl
      ? https.createServer(ssl, express)
      : http.createServer(express)

    server.keepAliveTimeout = keepAliveTimeout

    return new Promise(resolve => server.listen(
      port,
      () => {
        const address = `${ ssl ? 'https' : 'http' }://localhost:${ port }/`

        logger.info(`active on ${ address }`)

        resolve(server)
      },
    ))
  }
}

module.exports = Servers
