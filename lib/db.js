'use strict'

const { MongoClient } = require('mongodb')


class Db {
    constructor(config) {
        this.config = config

        const proxy = new Proxy(this, {
            get: (db, property) => {
                if (db[ property ]) {
                    return db[ property ]
                }

                db[ property ] = db.collection(property)

                return db[ property ]
            },
        })

        return proxy
    }

    async connect() {
        const {
            hostname,
            port,
            name,
            user,
            password,
            authentication_database,
        } = this.config

        const auth = user && password ? `${ user }:${ password }@` : ''
        const authSource = authentication_database
            ? `?authSource=${ authentication_database }`
            : ''

        const url = `mongodb://${ auth }${ hostname }:${ port }/${ authSource }`

        this.client = new MongoClient(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })

        await this.client.connect()

        this.db = this.client.db(name)

        return this
    }

    collection(name) {
        return this.db.collection(name)
    }

    close() {
        if (this.client) {
            this.client.close()
        }
    }
}

module.exports = Db
