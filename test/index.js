'use strict'

const { Stream } = require('stream')

const express = require('express')

const App = require('..')
const HttpError = require('../lib/http-error')


const mirror = ({ body }) => {
    body.reversed = !body.reversed
}

const app = new App()

app.use({
    '/': [ express.static('public') ],
    '/mirror': [ mirror ],
})

app.secure([
    '/shutdown',
])

app.get({
    '/': () => ({ success: true }),

    '/log': () => app.logger.info(1, 2),
    '/log/objects': () => app.logger.info({ a: 1 }, { b: 2 }),

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
})

app.post({
    '/mirror': ({ body }) => body,

    '/database/write': () => {
        app.db.timestamp.insertOne({ timestamp: Date.now() })
    },
    '/database/query': () => app.db.timestamp.find({}).toArray(),

    '/shutdown': () => app.shutdown(),
})

app.start()
