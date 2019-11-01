#!/usr/bin/env node

'use strict'

const argv = require('@dkh-dev/argv')

const App = require('..')


const main = async () => {
    const { db, key } = new App()

    if ('no-save' in argv) {
        const { string } = await key.generateOnly()

        console.log(string)
    } else {
        await db.connect()

        const string = await key.generate()

        console.log(string)

        await db.close()
    }
}

main()
