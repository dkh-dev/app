#!/usr/bin/env node

'use strict'

const config = require('../lib/config')
const Db = require('../lib/db')
const Authentication = require('../lib/authentication')


const main = async () => {
    const db = new Db(config.database)
    const authentication = new Authentication({ db, config })

    await db.connect()

    const key = await authentication.key()

    console.log(key)

    db.close()
}

main()
