'use strict'

const { MongoClient } = require('mongodb')


class Db {
    constructor(config) {
        if (!config) {
            return this
        }

        this.config = config

        return this.constructor.proxify(this)
    }

    async connect() {
        if (!this.config) {
            return
        }

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
    }

    collection(name) {
        return this.db.collection(name)
    }

    close() {
        if (this.client) {
            this.client.close()
        }
    }

    static proxify(db) {
        return new Proxy(db, {
            get: (db, property) => {
                if (db[ property ]) {
                    return db[ property ]
                }

                db[ property ] = db.collection(property)

                return db[ property ]
            },
        })
    }
}

module.exports = Db
