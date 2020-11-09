'use strict'

const test = require('tape')

const App = require('../..')


test('new Key() using db lazily initalizes .store', async t => {
  const { db, key } = new App({ key: { collection_name: 'keystore' } })

  await db.connect()
  t.finally(() => db.close())

  const k = await key.generate([ '/' ])

  t.resolves(key.verify(k, '/'), 'valid key')

  await t.await('wait until all the previous assertions complete')

  t.resolves(key.store.clear())

  t.end()
})
