'use strict'

process.chdir(__dirname)

const { createReadStream } = require('fs')
const { Stream } = require('stream')

const argv = require('@dkh-dev/argv')

const App = require('..')
const HttpError = require('../lib/http-error')
const stdio = require('./utils/stdio')


const app = new App()

const { db, logger } = app

app.lock([
  // npx keygen -s "/unlock-me /also-unlock-me"
  //   should unlock
  //     /unlock-me
  //     /unlock-me/*
  //     /also-unlock-me
  //   but not
  //     /unlock-me-to-be-wrong
  //     /never-unlock-me
  '/unlock-me',
  '/unlock-me/also',
  '/also-unlock-me',
  '/unlock-me-to-be-wrong',
  '/never-unlock-me',
])

app.use({
  '/mirror': ({ body }) => {
    body.reversed = !body.reversed
  },
})

app.static({
  // /static > ./index.js
  '/static': {
    root: './',
    index: 'index.js',
  },

  // /static/lib > ../index.js
  // /static/lib/assets.js > ../lib/assets.js
  // /static/lib/now.js > ../lib/utils/now.js
  '/static/lib': [
    {
      root: '../',
      index: 'index.js',
    },
    '../lib',
    '../lib/utils',
  ],
})

app.session([
  '/session',
])

app.schemas({
  // provide a schema for validation
  '/validator/user': {
    // req.body
    body: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: [ 'name', 'age' ],
      additionalProperties: false,
    },
  },

  // or define definition schemas and reference them in validation schemas

  // def schema
  contact: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      email: { type: 'string' },
    },
    required: [ 'id', 'email' ],
    additionalProperties: false,
  },
  // validation schema
  '/validator/contact': {
    body: { $ref: 'contact' },
  },

  // or just define definition schemas and validate data anywhere
  //   other than inside middlewares
  pet: {
    type: 'object',
    properties: {
      species: { type: 'string' },
      name: { type: 'string' },
    },
    required: [ 'species', 'name' ],
    additionalProperties: false,
  },
})

app.get({
  '/': () => ({ success: true }),

  '/send-stream': () => createReadStream('index.js'),
  '/send-explicitly': (req, res) => {
    res.send({ explicit: true })
  },
  '/send-server-sent-events': (req, res, next) => {
    res.set({
      connection: 'keep-alive',
      'access-control-allow-origin': '*',
      'cache-control': 'no-cache',
      'content-type': 'text/event-stream',
      'transfer-encoding': 'identity',
    })

    for (let i = 0; i < 3; i++) {
      setTimeout(
        () => {
          if (i === 2) {
            // for the connection to be closed immediately
            //   after the event stream ends,
            // instead of calling next() to end the request
            void next
            // manually close the socket
            res.socket.end()
          }

          res.write(`event: sse\n`)
          res.write(`data: ${ i }\n\n`)
        },
        i * 100,
      )
    }
  },

  '/log': () => logger.info('log a string and number', 1),
  '/log/objects': () => logger.info({ object: 1 }, [ 1 ]),

  '/error': () => {
    throw new Error('error')
  },
  '/error/async': async () => {
    await new Promise(resolve => setTimeout(resolve, 100))

    throw new HttpError(403, 'async')
  },
  '/error/stream': () => {
    const stream = new Stream()

    setTimeout(() => stream.emit('error', new HttpError(404, 'stream')), 100)

    return stream
  },
  '/error/next': (req, res, next) => next(new HttpError(405, 'next')),

  '/unlock-me': () => ({ unlocked: true }),
  '/unlock-me/also': () => ({ unlocked: true }),
  '/also-unlock-me': () => ({ unlocked: true }),
  '/unlock-me-to-be-wrong': () => ({ goneWrong: true }),
  '/never-unlock-me': () => ({ goneWrong: true }),

  '/misc': () => app.config.misc,

  '/session-not-enabled': ({ session }) => ({
    enabled: typeof session === 'object',
  }),
  '/session': ({ session }) => {
    session.count = (session.count || 0) + 1

    return {
      enabled: typeof session === 'object',
      count: session.count,
    }
  },
  '/session/destroy': req => new Promise((resolve, reject) => {
    req.session.destroy(error => {
      if (error) {
        reject(error)
      } else {
        resolve({ success: true })
      }
    })
  }),

  '/stories/query': () => (
    db.stories.find({}).sort({ createdAt: -1 }).toArray()
  ),
  '/stories/query/last': async () => {
    const [ last ] = await db.stories
      .find({}, { projection: { _id: 0, createdAt: 0 } })
      .sort({ createdAt: -1 })
      .toArray()

    return last || null
  },

  '/stdio': () => stdio,

  '/delete-keys-from-database': async () => {
    await db.keys.deleteMany({})
  },

  '/shutdown': () => {
    app.shutdown()
  },
})

app.post({
  '/mirror': ({ body }) => body,

  '/stories/add': async ({ body }) => {
    await db.stories.deleteMany({ createdAt: { $lt: Date.now() - 86400000 } })
    await db.stories.insertOne({ ...body, createdAt: Date.now() })
  },

  '/validator/pet': ({ body: pet }) => {
    // validating using a predefined schema
    app.validate('pet', pet)
    // validating using a custom schema
    app.validate({ enum: [ 'dog', 'cat' ] }, pet.species)

    return pet
  },
  '/validator/:any': ({ body }) => body,
})

if (argv.auto) {
  app.start().then(require('./test'))
} else {
  app.start()
}
