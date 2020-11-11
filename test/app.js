'use strict'

process.chdir(__dirname)

const { Stream } = require('stream')
const { createReadStream } = require('fs')

const App = require('..')
const { HttpError } = App
const stdio = require('./utils/stdio')


const app = new App({ info: 'stdout', error: 'stderr' })
const { db, logger, config } = app

/**
 * key generated with
 *     npx keygen -s "/lock/0 /lock/1/"
 *   may unlock
 *     /lock/0
 *     /lock/1/
 *     /lock/1/2
 *   may not unlock
 *     /lock/1
 *     /lock/2
 *     /lock/3/0
 */
app.lock([
  '/lock/0',
  '/lock/1',
  '/lock/2',
  '/lock/3',
])

app.use({
  '/duplicate': [
    app.json,
    // this duplicates request body
    ({ body }) => body.push(...body),
  ],

  '/stories/create': app.json,
})

app.schema({
  // definition schemas

  story: {
    definitions: {
      id: { type: 'string', maxLength: 20 },
      contents: { type: 'string', maxLength: 1000 },
    },
  },

  // validator middlewares
  // keys starting with '/' are paths

  '/duplicate': {
    type: 'array',
    items: { type: 'integer' },
  },

  '/stories/create': {
    type: 'object',
    properties: {
      contents: { $ref: 'story#/definitions/contents' },
    },
    additionalProperties: false,
  },
})

app.get({
  '/': () => ({ text: 'hello' }),

  '/response/stream': () => createReadStream('index.js'),
  '/response/write': (request, response) => {
    response.write('hello')
  },
  '/response/server-sent-events': (request, response) => {
    response.set({
      'content-type': 'text/event-stream',
      'transfer-encoding': 'identity',
    })

    const max = 2

    for (let i = 1; i <= max; i++) {
      setTimeout(() => {
        response.write(`event: count\n`)
        response.write(`data: ${ i }\n\n`)

        if (i === max) {
          response.continue(false).end()
        }
      }, i)
    }

    // prevents the app from calling `response.end()` after this handler ends
    response.continue()
  },

  '/log': () => logger.info('string', 1),
  '/log/object': () => logger.debug({ value: 1 }, [ 1 ]),

  '/error': () => {
    throw new Error('error')
  },
  '/error/async': async () => {
    await new Promise(resolve => setTimeout(resolve, 1))

    throw new HttpError(403, 'async')
  },
  '/error/stream': () => {
    const stream = new Stream()

    setTimeout(() => stream.emit('error', new HttpError(405, 'stream')), 1)

    return stream
  },

  '/lock/0': () => true,
  '/lock/1/': () => true,
  '/lock/1/2': () => true,
  '/lock/1': () => false,
  '/lock/2': () => false,
  '/lock/3/0': () => false,

  '/application': () => config.application,

  '/stories/query': () => (
    db.stories
      .find({}, {
        projection: { _id: 0, createdAt: 0 },
        sort: { createdAt: -1 },
      })
      .toArray()
  ),
  '/stories/query/last': () => (
    db.stories
      .findOne({}, {
        projection: { _id: 0, createdAt: 0 },
        sort: { createdAt: -1 },
      })
  ),

  '/ips': ({ ips, ip }) => ({ ips, ip }),

  '/stdio': () => stdio,

  '/shutdown': () => void app.close(),
})

app.post({
  '/duplicate': ({ body }) => body,

  '/stories/create': async ({ body: { contents } }) => {
    await db.stories.deleteMany({ createdAt: { $lt: Date.now() - 86400000 } })
    await db.stories.insertOne({ contents, createdAt: Date.now() })
  },
})

if (require.main === module) {
  app.start()
} else {
  module.exports = app
}
