'use strict'

const { randomBytes, hmac } = require('@dkh-dev/crypto')

const HttpError = require('./http-error')


class Key {
    constructor(app) {
        this.app = app

        this.authenticate = async ({ headers: { authorization } }) => {
            if (await this.verify(authorization)) {
                return
            }

            throw new HttpError(401, 'unauthorized')
        }
    }

    activate() {
        if (!this.app.db || !this.app.config.key) {
            return
        }

        const { locked } = this.app.settings.routes

        if (locked) {
            locked.forEach(path => {
                this.app.middlewares.mount(path, this.authenticate)
            })
        }
    }

    async generate() {
        const { secret, size, id_size, encoding } = this.app.config.key

        if (size < id_size) {
            throw Error(`key size must be greater than or equal to ${ id_size }`)
        }

        const key = await randomBytes(size)
        const id = key.slice(0, id_size)
        const hash = await hmac.sha256(key, secret)

        await this.app.db.key.insertOne({ id, hash })

        return key.toString(encoding)
    }

    async verify(key) {
        const buffer = this.buffer(key)

        if (!buffer) {
            return false
        }

        const id = buffer.slice(0, this.app.config.key.id_size)
        const document = await this.app.db.key.findOne(
            { id },
            { projection: { hash: true } },
        )

        if (!document) {
            return false
        }

        const { secret } = this.app.config.key

        return document.hash.buffer.equals(await hmac.sha256(buffer, secret))
    }

    buffer(key) {
        if (!key) {
            return null
        }

        const { size, encoding } = this.app.config.key

        const buffer = Buffer.from(key, encoding)

        if (buffer.length !== size) {
            return null
        }

        return buffer
    }
}

module.exports = Key
