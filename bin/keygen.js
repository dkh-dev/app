#!/usr/bin/env node

'use strict'

const argv = require('@dkh-dev/argv')

const App = require('..')


/**
 * Generate key only.
 *
 * The generated key will not be stored.
 */
const noSave = argv.n || argv[ 'no-save' ]
/**
 * Granted scope.
 */
const scope = argv.s || argv.scope || ''

const scopes = scope.split(' ').filter(Boolean)


const main = async () => {
  const { db, key } = new App()

  if (noSave) {
    const { string } = await key.generateOnly()

    console.log(string)
  } else {
    if (scopes.length === 0) {
      throw Error('missing parameter -scope or -s')
    }

    await db.connect()

    const string = await key.generate(scopes)

    console.log(string)

    await db.close()
  }
}

main()
