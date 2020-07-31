'use strict'

const { readFileSync } = require('fs')
const { execSync } = require('child_process')

const test = require('./utils/test')


// eslint-disable-next-line max-statements
const main = app => {
  const { config: { server: { port, post_max_size: limit }, misc } } = app

  test.origin(`http://localhost:${ port }`)

  test('Home page', async t => {
    await t.request(
      '/',
      { status: 200, data: { success: true } },
      'home',
    )
  })

  test('Static assets', async t => {
    await t.request(
      '/static',
      { status: 200, data: readFileSync('index.js', 'utf8') },
      'current directory',
    )
    await t.request(
      '/static/lib',
      { data: readFileSync('../index.js', 'utf8') },
      'defaults to ../index.js',
    )
    await t.request(
      '/static/lib/assets.js',
      { data: readFileSync('../lib/assets.js', 'utf8') },
      'from ../lib',
    )
    await t.request(
      '/static/lib/config.js',
      { data: readFileSync('../lib/config.js', 'utf8') },
      'from ../lib',
    )
    await t.request(
      '/static/lib/is-production.js',
      { data: readFileSync('../lib/utils/is-production.js', 'utf8') },
      'not found from ../lib, serving from ../lib/utils',
    )
  })

  test('Send methods', async t => {
    await t.request(
      '/send-stream',
      { data: readFileSync('index.js', 'utf8') },
      'return a stream as response',
    )
    await t.request(
      '/send-explicitly',
      { data: { explicit: true } },
      'send data using res.send',
    )
    await t.request(
      '/send-server-sent-events',
      { data: 'event: sse\ndata: 0\n\nevent: sse\ndata: 1\n\n' },
      'send as server sent events',
    )
  })

  test('Log', async t => {
    await t.request(
      '/log',
      { stdout: 'log a string and number 1' },
      'should log a string and number 1 to console',
    )
    await t.request(
      '/log/objects',
      { stdout: '{ object: 1 } [ 1 ]' },
      'should log an object and an array to console',
    )
  })

  test('Errors', async t => {
    await t.request(
      '/error',
      { status: 400, stderr: 'Error: error' },
      'errors should be catched, status code defaults to 400',
    )
    await t.request(
      '/error/async',
      { status: 403, stderr: 'HttpError: async' },
      'errors in async function should be catched',
    )
    await t.request(
      '/error/stream',
      { status: 404, stderr: 'HttpError: stream' },
      'errors in response streams should be catched',
    )
    await t.request(
      '/error/next',
      { status: 405, stderr: 'HttpError: next' },
      'an error being passed to next() should be catched',
    )
  })

  test('User-defined config properties', async t => {
    await t.request(
      '/misc',
      { data: misc },
      'any config properties are loaded',
    )
  })

  test('Session', async t => {
    await t.request(
      '/session-not-enabled',
      { data: { enabled: false } },
      'session should not be enabled for this path',
    )

    const { headers } = await t.request(
      '/session',
      { data: { enabled: true, count: 1 } },
      'session first initialized',
    )
    const cookie = headers[ 'set-cookie' ]
      .map(cookie => cookie.split(';').shift())
      .join(', ')

    // should be in the same session with the previous request
    await t.request(
      { endpoint: '/session', headers: { cookie } },
      { data: { enabled: true, count: 2 } },
      'same session, so count should be 2',
    )
    await t.request(
      { endpoint: '/session/destroy', headers: { cookie } },
      { data: { success: true } },
      'session gets destroyed',
    )
    await t.request(
      { endpoint: '/session', headers: { cookie } },
      { data: { enabled: true, count: 1 } },
      `session should've been destroyed, new session gets intialized`,
    )
  })

  test('MongoDB', async t => {
    const nonce = Math.random()

    await t.request(
      { endpoint: '/stories/add', data: { nonce } },
      { status: 200 },
      'add a story with a random nonce',
    )
    await t.request(
      '/stories/query/last',
      { data: { nonce } },
      'the last story should be the story added above',
    )
  })

  test('Middlewares', async t => {
    await t.request(
      { endpoint: '/mirror', data: { text: 'text', reversed: false } },
      { data: { text: 'text', reversed: true } },
      'data.reversed should be true',
    )
    await t.request(
      { endpoint: '/mirror', data: { text: '!'.repeat(limit) } },
      { status: 400, stderr: 'PayloadTooLargeError:' },
      'request entity too large',
    )
  })

  test('Authentication key', async t => {
    await t.request(
      '/delete-keys-from-database',
      { status: 200 },
      'delete all keys',
    )

    const stdout = execSync(`node ../bin/keygen -s "/unlock-me /also-unlock-me"`)
    const headers = { authorization: stdout.toString().trim() }

    await t.request(
      '/unlock-me',
      { status: 401, stderr: 'Error:' },
      'without a key, access should be denied',
    )
    await t.request(
      { endpoint: '/unlock-me', headers },
      { status: 200, data: { unlocked: true } },
      'using a key with valid scope, access should be allowed',
    )
    await t.request(
      { endpoint: '/unlock-me/also', headers },
      { status: 200, data: { unlocked: true } },
      'a key should be valid for sub-scopes',
    )
    await t.request(
      { endpoint: '/also-unlock-me', headers },
      { status: 200, data: { unlocked: true } },
      'to declare multiple scopes, use spaces as separators',
    )
    await t.request(
      { endpoint: '/unlock-me-to-be-wrong', headers },
      { status: 401 },
      '/scope-something is not a sub-scope of /scope',
    )
    await t.request(
      { endpoint: '/never-unlock-me', headers },
      { status: 401 },
      'a key with invalid scopes should be rejected',
    )
  })

  test('Shutdown', async t => {
    await t.request('/shutdown', { status: 200 })
  })
}

module.exports = main
