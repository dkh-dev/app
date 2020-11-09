#!/usr/bin/env node

'use strict'

const argv = require('@dkh-dev/argv')

const App = require('..')


const { db, key } = new App()

const gen = async () => {
  const s = argv.s || argv.scopes || ''
  const comment = argv.m || argv.comment

  const scopes = s.split(/[\s,]/).filter(Boolean)

  if (scopes.length === 0) {
    throw Error('missing parameter --scopes or -s')
  }

  const k = await key.generate(scopes, { comment })

  console.log(k)
}

const main = async () => {
  try {
    await db.connect()
    await gen()
  } finally {
    db.close()
  }
}

main()
