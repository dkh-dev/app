'use strict'

const { createReadStream } = require('fs')
const { Stream } = require('stream')

const App = require('..')
const HttpError = require('../lib/http-error')


const app = new App()

const { db, logger } = app

app.lock([
  // npx keygen -s '/unlock-me /also-unlock-me'
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

  // npx keygen -s /shutdown
  '/shutdown',
])

app.use({
  '/mirror': ({ body }) => {
    body.reversed = !body.reversed
  },
})

app.sessions([
  '/session',
])

app.get({
  '/': () => ({ success: true }),

  '/package.json': () => createReadStream('metadata.json'),

  '/send-explicitly': (_, res) => {
    res.send({ explicit: true })
  },

  '/log': () => logger.info(1, 2),
  '/log/objects': () => logger.info({ a: 1 }, { b: 2 }),

  '/error': () => {
    throw new HttpError(403, 'error')
  },
  '/error/async': async () => {
    await new Promise(resolve => setTimeout(resolve, 100))

    throw new HttpError(404, 'error async')
  },
  '/error/stream': () => {
    const stream = new Stream()

    setTimeout(() => stream.emit('error', new Error('stream error')), 100)

    return stream
  },
  '/error/next': (req, res, next) => next(new Error('next')),

  '/unlock-me': () => ({ unlocked: true }),
  '/unlock-me/also': () => ({ unlocked: true }),
  '/also-unlock-me': () => ({ unlocked: true }),
  '/unlock-me-to-be-wrong': () => ({ goneWrong: true }),
  '/never-unlock-me': () => ({ goneWrong: true }),

  '/misc': () => app.config.misc,

  '/no-session': ({ session }) => ({ session }),
  '/session': ({ session }) => {
    session.views = (session.views || 0) + 1

    return { id: session.id, session }
  },
  '/session/reset': ({ session }) => {
    session.views = 1

    return { id: session.id, session }
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
})

app.post({
  '/mirror': ({ body }) => body,

  '/stories/add': ({ body }) => {
    db.stories.insertOne({ ...body, createdAt: Date.now() })
  },
  '/stories/query': () => db.stories.find({}).toArray(),

  '/shutdown': () => app.shutdown(),
})

app.start()
