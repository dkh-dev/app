'use strict'

const test = require('tape')

const Db = require('../../lib/db')
const KeyValueStore = require('../../lib/utils/key-value-store')
const { database: config } = require('../../lib/config')()


test('KeyValueStore', async t => {
  const db = new Db(config)

  await db.connect()
  t.finally(() => db.close())

  const store = new KeyValueStore(db.kvs)

  await store.clear()

  t.equal(store.size, 0, 'empty store')
  t.notOk(store.has(1))
  t.equal(store.get(1), void 0)
  t.eq(store.keys(), [])

  await t.await('wait until all the previous assertions complete')

  await store.set(1, 1)
  await store.set('1', '1')

  t.equal(store.size, 2, 'after adding two values')
  t.ok(store.has(1))
  t.ok(store.has('1'))
  t.equal(store.get(1), 1)
  t.equal(store.get('1'), '1')
  t.eq(store.keys(), [ 1, '1' ])

  await t.await('wait until all the previous assertions complete')

  await store.delete(1)

  t.equal(store.size, 1, 'after deleting one')
  t.notOk(store.has(1))
  t.ok(store.has('1'))
  t.equal(store.get(1), void 0)
  t.equal(store.get('1'), '1')
  t.eq(store.keys(), [ '1' ])

  await t.await('wait until all the previous assertions complete')

  const buffer = Buffer.from('buffer')

  await store.set(buffer, 1)

  t.ok(store.has(buffer), `buffer as key works`)
  t.equal(store.get(buffer), 1)
  // buffer as value needs conversion, which is not implemented

  await t.await('wait until all the previous assertions complete')

  await store.clear()

  t.end()
})
