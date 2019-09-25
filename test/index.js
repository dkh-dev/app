'use strict'

const argv = require('@dkh-dev/argv')

const App = require('..')
const HttpError = require('../lib/http-error')


const app = new App(argv.c || argv.config)

app.disable('x-powered-by')

app.use({
    '/': ({ body }) => {
        body.middleware = true
    },
    '/require-auth': app.authentication.authenticate,
})

app.get({
    '/error': () => {
        throw new HttpError(403, 'error')
    },
    '/error-async': () => {
        throw new HttpError(404, 'error async')
    },
    '/require-auth': () => true,
})

app.post({
    '/mirror': ({ body }) => body,
    '/database-write': () => {
        app.db.timestamps.insertOne({ timestamp: Date.now() })
    },
    '/database-query': () => app.db.timestamps.find({}).toArray(),
})

app.start()
