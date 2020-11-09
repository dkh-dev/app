'use strict'

const test = require('tape')

const Key = require('../../lib/key')
const { key: config } = require('../../lib/config')()

const Store = require('../utils/store')


const store = new Store()
const cache = new Store()
const key = new Key(config, { store, cache })


test('scopes /', async t => {
  t.plan(3)

  const k = await key.generate([ '/' ])

  t.resolves(key.verify(k, '/'))
  t.resolves(key.verify(k, '/any'), 'valid sub-scope')

  t.rejects(key.verify(k, '', 'not a path'))
})

test('scopes /a, /b', async t => {
  const k = await key.generate([ '/a', '/b', '/c/' ])

  t.plan(9)

  t.resolves(key.verify(k, '/a'))
  t.resolves(key.verify(k, '/b'))
  t.resolves(key.verify(k, '/b/any'))
  t.resolves(key.verify(k, '/c/'))
  t.resolves(key.verify(k, '/c/any'))

  t.rejects(key.verify(k, '/c'))
  t.rejects(key.verify(k, '/d'))
  t.rejects(key.verify(k, '/d/../a'))
  t.rejects(key.verify(k, '/a-different-path'))
})

test('store and cache', async t => {
  const k = await key.generate([ '/' ])

  t.plan(5)

  const one = new Key(config, { store: new Store(), cache })

  // the generated key was stored in a different store
  // hence failed verification
  t.rejects(one.verify(k, '/'), `different store`)
  await t.await()

  // this causes the verification of the generated key to be cached
  t.resolves(key.verify(k, '/'), 'caches the verification')
  // wait til the previous verification finishes
  await t.await()

  // cached keys won't be verified again
  // so this verification should be successful
  t.resolves(one.verify(k, '/'), `same cache store`)

  const two = new Key(config, { store, cache: new Store() })

  // basically the same with `one`, hence same result
  t.resolves(two.verify(k, '/'), `same store and config`)

  const three = new Key({ size: 8 }, { store, cache: new Store() })

  // a key of a different size should be invalid
  t.rejects(three.verify(k, '/'), 'same store different config')
})
