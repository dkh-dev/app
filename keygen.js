'use strict'

const fs = require('fs')

const yaml = require('js-yaml')
const argv = require('@dkh-dev/argv')

const Authentication = require('./lib/authentication')
const Db = require('./lib/db')


const configFile = argv.c || argv.config
const config = yaml.safeLoad(fs.readFileSync(configFile))


const main = async () => {
    const db = await Db.connect(config.database)
    const authenticationKey = new Authentication({ db, config })

    const key = await authenticationKey.generate()

    console.log(key)

    db.close()
}

main()
