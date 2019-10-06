'use strict'

const { createReadStream } = require('fs')
const { Stream } = require('stream')

const App = require('..')
const HttpError = require('../lib/http-error')


const app = new App()

const { db, logger } = app

app.lock([
    '/unlock-me',
    '/shutdown',
])

app.use({
    '/mirror': [
        // reverses request body
        ({ body }) => {
            body.reversed = !body.reversed
        },
    ],
})

app.get({
    '/': () => ({ success: true }),

    '/package.json': () => createReadStream('public/package.json'),

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

    '/unlock-me': () => ({ unlocked: true }),
})

app.post({
    '/mirror': ({ body }) => body,

    '/story/add': ({ body }) => {
        db.story.insertOne({ ...body, createdAt: Date.now() })
    },
    '/story/query': () => db.story.find({}).toArray(),

    '/shutdown': () => app.shutdown(),
})

app.start()
