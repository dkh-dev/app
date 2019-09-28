'use strict'

const { randomBytes, hmac } = require('@dkh-dev/crypto')

const HttpError = require('./http-error')


class Authentication {
    constructor(app) {
        this.app = app

        this.authenticate = async ({ headers: { authorization } }) => {
            if (!this.app.db || !this.app.config.authentication) {
                return
            }

            if (await this.verify(authorization)) {
                return
            }

            throw new HttpError(401, 'unauthorized')
        }
    }

    async key() {
        const { secret, encoding, key_size } = this.app.config.authentication
        const { idSize } = this.constructor

        if (key_size < idSize) {
            throw Error(`key size must be greater than or equal to ${ idSize }`)
        }

        const key = await randomBytes(key_size)
        const id = key.slice(0, idSize)
        const hash = await hmac.sha256(key, secret)

        await this.app.db.authentication.insertOne({ id, hash })

        return key.toString(encoding)
    }

    async verify(key) {
        const buffer = this.buffer(key)

        if (!buffer) {
            return false
        }

        const id = buffer.slice(0, this.constructor.idSize)
        const document = await this.app.db.authentication.findOne(
            { id },
            { projection: { hash: true } },
        )

        if (!document) {
            return false
        }

        const { secret } = this.app.config.authentication

        return document.hash.buffer.equals(await hmac.sha256(buffer, secret))
    }

    buffer(key) {
        if (!key) {
            return null
        }

        const { key_size, encoding } = this.app.config.authentication

        const buffer = Buffer.from(key, encoding)

        if (buffer.length !== key_size) {
            return null
        }

        return buffer
    }
}

Authentication.idSize = 32

module.exports = Authentication
