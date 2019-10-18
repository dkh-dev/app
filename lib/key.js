'use strict'

const { randomBytes, sha256 } = require('@dkh-dev/crypto')
const FixedSizeSet = require('@dkh-dev/fixed-size/set')

const HttpError = require('./http-error')


class Key {
    constructor(app) {
        this.app = app

        this.keys = new FixedSizeSet(100)

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
        const { size, encoding } = this.app.config.key

        const key = await randomBytes(size)
        const hash = sha256(key)

        await this.app.db.keys.insertOne({ _id: hash })

        return key.toString(encoding)
    }

    async verify(key) {
        if (this.keys.has(key)) {
            return true
        }

        const buffer = this.buffer(key)

        if (!buffer) {
            return false
        }

        const hash = sha256(buffer)

        const valid = await this.app.db.keys.find({ _id: hash }).count()

        if (valid) {
            this.keys.add(key)
        }

        return valid
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
