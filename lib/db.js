'use strict'

const { MongoClient } = require('mongodb')
const ExtendedMap = require('@dkh-dev/extended-map')


class Db {
    constructor(config) {
        if (!config) {
            return this
        }

        this.config = config
        this.collections = new ExtendedMap()

        return this.proxify(this)
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
        return this.collections.get(name, () => this.db.collection(name))
    }

    close() {
        if (this.client) {
            this.client.close()
        }
    }

    proxify(db) {
        return new Proxy(db, {
            get: (db, property) => {
                if (db[ property ]) {
                    return db[ property ]
                }

                db[ property ] = new Proxy({}, {
                    get: (_, method) => {
                        const collection = this.collection(property)

                        return collection[ method ]
                    },
                })

                return db[ property ]
            },
        })
    }
}

module.exports = Db
