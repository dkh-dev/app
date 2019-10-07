'use strict'

const fs = require('fs')
const http = require('http')
const https = require('https')


class Servers {
    constructor(app) {
        this.app = app
    }

    start() {
        const {
            port,
            ssl_port,
            ssl_certificate,
            ssl_certificate_key,
        } = this.app.config.server

        if (port) {
            this.http = this.server({ port })
        }

        if (ssl_port && ssl_certificate && ssl_certificate_key) {
            try {
                this.https = this.server({
                    port: ssl_port,
                    certificate: ssl_certificate,
                    certificateKey: ssl_certificate_key,
                })
            } catch (error) {
                this.app.logger.error(error)
            }
        }
    }

    shutdown() {
        this.app.logger.info('shutting down')

        if (this.http) {
            this.http.close()
        }

        if (this.https) {
            this.https.close()
        }
    }

    server({ port, certificate, certificateKey }) {
        const ssl = certificate && certificateKey

        let server

        if (ssl) {
            const cert = fs.readFileSync(certificate)
            const key = fs.readFileSync(certificateKey)
            const options = { cert, key }

            server = https.createServer(options, this.app.express)
        } else {
            server = http.createServer(this.app.express)
        }

        server.keepAliveTimeout = this.app.config.server.keep_alive_timeout

        return server.listen(port, () => this.app.logger.info(
            `active on ${ ssl ? 'https' : 'http' }://localhost:${ port }/`
        ))
    }
}

module.exports = Servers
