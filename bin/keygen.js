#!/usr/bin/env node

'use strict'

const App = require('..')


const main = async () => {
    const { db, key } = new App()

    await db.connect()
    await db.keys.createIndex({ id: 1 }, { unique: true })

    console.log(await key.generate())

    await db.close()
}

main()
