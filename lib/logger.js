'use strict'

const fs = require('fs')

const argv = require('@dkh-dev/argv')

const HttpError = require('./http-error')
const DateTime = require('./date-time')


/**
 * @member {Function} info
 * @member {Function} error
 * @member {Function} debug
 */
class Logger {
    constructor(config) {
        const streams = Object.entries(config)

        if (this.constructor.production) {
            this.streams = new Set()
            this.debug = this.constructor.void

            streams.forEach(([ name, file ]) => this.stream(name, file))
        } else {
            this.debug = this.constructor.console

            streams.forEach(([ name ]) => {
                this[ name ] = this.constructor.console
            })
        }
    }

    stream(name, file) {
        const stream = fs.createWriteStream(
            file,
            this.constructor.writeStreamOptions,
        )

        stream.on('error', ({ code }) => {
            if (code === 'ENOENT') {
                this[ name ] = this.constructor.void

                this.streams.delete(stream)
            }
        })

        this[ name ] = any => stream.write(
            this.constructor.format(any),
            () => void 0,
        )

        this.streams.add(stream)
    }

    close() {
        if (this.constructor.production) {
            this.streams.forEach(stream => stream.close())
        }
    }

    static format(any) {
        let data

        if (typeof any !== 'object' || any === null) {
            data = String(any)
        } else if (any instanceof HttpError) {
            const { name, code, message } = any

            data = `${ name }: ${ code }${ message ? ` ${ message }` : '' }`
        } else if (any instanceof Error) {
            const { name, message, stack } = any

            data = `${ name }: ${ message }\n${ stack }`
        } else {
            data = JSON.stringify(any)
        }

        return `[${ DateTime.now() }] ${ data }\n`
    }

    static console(any) {
        console.log(DateTime.now(), any)
    }

    static void() {
        // do nothing
    }
}

Logger.writeStreamOptions = {
    flags: 'a',
    mode: 0o755,
    emitClose: true,
}

Logger.production = argv.production || process.env.NODE_ENV === 'production'

module.exports = Logger
