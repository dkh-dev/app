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
const comment = argv.m || argv.comment


const { db, key } = new App()

const generateOnly = async () => {
  const { string } = await key.generateOnly()

  console.log(string)
}


const generate = async () => {
  const scopes = scope.split(' ').filter(Boolean)

  if (scopes.length === 0) {
    throw Error('missing parameter -scope or -s')
  }

  await db.connect()

  const string = await key.generate({
    scopes,
    comment,
  })

  console.log(string)

  await db.close()
}

if (noSave) {
  generateOnly()
} else {
  generate()
}
