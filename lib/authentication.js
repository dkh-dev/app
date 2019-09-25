'use strict'

const { randomBytes, scrypt } = require('@dkh-dev/crypto')

const HttpError = require('./http-error')


class Authentication {
    constructor(app) {
        this.app = app
        this.config = this.app.config.authentication
        this.authenticate = this.constructor.authenticate.bind(this)
    }

    async generate() {
        const { secret, encoding, key_length } = this.config

        const key = await randomBytes(key_length)
        const id = key.slice(0, 32)

        const hash = await scrypt.hash(key, secret)

        await this.app.db.authentication_key.insertOne({ id, hash })

        return key.toString(encoding)
    }

    async verify(key) {
        const { secret, encoding } = this.config
        const buffer = Buffer.from(key, encoding)
        const id = buffer.slice(0, 32)
        const { hash } = await this.app.db.authentication_key.findOne(
            { id },
            { projection: { hash: true } },
        )

        return scrypt.verify(buffer, secret, hash.buffer)
    }

    static async authenticate({ headers: { authorization } }) {
        if (!this.app.db || !this.config) {
            return
        }

        if (authorization && await this.verify(authorization)) {
            return
        }

        throw new HttpError(401)
    }
}

module.exports = Authentication
