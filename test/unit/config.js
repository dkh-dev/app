'use strict'

const test = require('tape')

const config = require('../../lib/config')


test('config()', t => {
  const merged = {
    server: {
      port: 8080,
      keep_alive_timeout: 5,
      max_body_size: 100,
    },
    logger: { info: 'stdout', error: 'stderr', debug: 'stdout' },
    database: {
      hostname: 'localhost',
      port: 27017,
      pool_size: 1,
      ignore_undefined: true,
      name: 'test',
      user: 'user',
      password: 'abc123',
    },
    validator: {
      strict: true,
      remove_additional: false,
    },
    key: { size: 64, encoding: 'base64', collection_name: 'keys' },
    application: { name: 'value' },
  }

  t.eq(config(), merged, 'merged with config from app.yaml')

  const update = {
    server: { port: 8008 },
    logger: { debug: null },
    application: { id: 1 },
    updated: true,
    // invalid as config.database is an object
    database: 'invalid',
    // invalid as config.validator is an object
    validator: null,
  }
  const updated = {
    server: {
      port: 8008,
      keep_alive_timeout: 5,
      max_body_size: 100,
    },
    logger: { info: 'stdout', error: 'stderr', debug: null },
    database: {
      hostname: 'localhost',
      port: 27017,
      pool_size: 1,
      ignore_undefined: true,
      name: 'test',
      user: 'user',
      password: 'abc123',
    },
    validator: {
      strict: true,
      remove_additional: false,
    },
    key: { size: 64, encoding: 'base64', collection_name: 'keys' },
    application: { name: 'value', id: 1 },
    updated: true,
  }

  t.eq(config(update), updated, 'initialize config with options')
  t.eq(config().set(update), updated, 'set inline config')

  t.end()
})
