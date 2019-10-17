'use strict'

const { randomBytes, sha256 } = require('@dkh-dev/crypto')

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
        if (!this.app.db) {
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
        const { secret, size, encoding } = this.app.config.key

        const key = await randomBytes(size)
        const hash = sha256(key, secret)

        await this.app.db.keys.insertOne({ _id: hash })

        return key.toString(encoding)
    }

    verify(key) {
        const buffer = this.buffer(key)

        if (!buffer) {
            return false
        }

        const { secret } = this.app.config.key
        const hash = sha256(buffer, secret)

        return this.app.db.keys.find({ _id: hash }).count()
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
