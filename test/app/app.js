'use strict'

const { readFileSync } = require('fs')
const { execSync } = require('child_process')

const test = require('tape')

const app = require('../app')


require('../utils/request')


test('Start app', t => {
  t.plan(1)

  t.doesNotThrow(() => app.start())
})

test('Send response', t => {
  t.request('/', {
    status: 200,
    data: { text: 'hello' },
  }, 'home')

  t.request('/response/stream', {
    status: 200,
    data: readFileSync('index.js', 'utf8'),
  }, 'send a stream')

  t.request('/response/write', {
    data: 'hello',
  }, 'send data using response.write')

  t.request('/response/server-sent-events', {
    data: 'event: count\ndata: 1\n\nevent: count\ndata: 2\n\n',
  }, 'send server-sent-events')

  t.end()
})

test('Log', t => {
  t.request('/log', {
    stdout: 'string 1',
  }, 'should log a string and number 1 to console')

  t.request('/log/object', {
    stdout: '{ value: 1 } [ 1 ]',
  }, 'should log an object and an array to console')

  t.end()
})

test('Errors', t => {
  t.request('/error', {
    status: 400,
    stderr: 'Error: error',
  }, 'errors should be caught, status code defaults to 400')

  t.request('/error/async', {
    status: 403,
    stderr: 'HttpError: async',
  }, 'errors in async function should be caught')

  t.request('/error/stream', {
    status: 405,
    stderr: 'HttpError: stream',
  }, 'errors in response streams should be caught')

  t.end()
})

test('Middleware', t => {
  t.request('/duplicate', { data: [ 1, 2 ] }, {
    data: [ 1, 2, 1, 2 ],
  }, 'the array values should be duplicated')

  t.request('/duplicate', { data: { text: 'x'.repeat(1e6) } }, {
    status: 413,
  }, 'request entity too large')

  t.end()
})

test('MongoDB', async t => {
  const contents = Date.now().toString()

  await t.request('/stories/create', { data: { contents } }, {
    status: 200,
  }, 'add random contents')

  t.request('/stories/query/last', {
    data: { contents },
  }, 'the last story should be the story added above')

  t.end()
})

test('Authentication key', async t => {
  const stdout = execSync(`node ../bin/keygen -s "/lock/0 /lock/1/"`)
  const headers = { authorization: stdout.toString().trim() }

  t.request('/lock/0', {
    status: 401,
  }, 'without a key, access should be denied')

  t.request('/lock/0', { headers }, {
    status: 200,
    data: true,
  }, 'using a key with valid scope, access should be allowed')

  t.request('/lock/1/', { headers }, {
    status: 200,
    data: true,
  }, 'using a key with valid scope, access should be allowed')

  t.request('/lock/1/2', { headers }, {
    status: 200,
    data: true,
  }, 'a key should be valid for sub-scopes')

  t.request('/lock/1', { headers }, {
    status: 401,
  }, 'the generated key only valid for sub-scopes of /lock/1/')

  t.request('/lock/2', { headers }, {
    status: 401,
  }, 'invalid scope')

  t.request('/lock/3/0', { headers }, {
    status: 401,
  }, 'invalid scope')

  await t.await('wait until all the previous assertions complete')

  const { key } = app

  t.resolves(key.store.clear())

  t.end()
})

test('Close app', t => {
  t.plan(1)

  t.doesNotThrow(() => app.close())
})
