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

app.session([
    '/session',
])

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
