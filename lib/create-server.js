'use strict'

const fs = require('fs')
const http = require('http')
const https = require('https')

const logger = require('./logger')


const createServer = (app, { port, certificate, certificateKey }) => {
    let server
    const secure = certificate && certificateKey

    if (secure) {
        const cert = fs.readFileSync(certificate)
        const key = fs.readFileSync(certificateKey)
        const options = { cert, key }

        server = https.createServer(options, app)
    } else {
        server = http.createServer(app)
    }

    return server.listen(port, () => logger.debug(`${ secure ? 'https' : 'http' }://localhost:${ port }/`))
}

module.exports = createServer
