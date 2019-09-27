'use strict'

const fs = require('fs')

const argv = require('@dkh-dev/argv')

const HttpError = require('./http-error')
const DateTime = require('./date-time')


class Logger {
    constructor({ info_log, error_log }) {
        if (this.constructor.production) {
            this.infoLog = fs.createWriteStream(
                info_log,
                this.constructor.writeStreamOptions,
            )
            this.errorLog = fs.createWriteStream(
                error_log,
                this.constructor.writeStreamOptions,
            )

            this.info = any => {
                this.infoLog.write(this.constructor.format(any), () => void 0)
            }
            this.error = any => {
                this.errorLog.write(this.constructor.format(any), () => void 0)
            }
            this.debug = () => void 0
        } else {
            // eslint-disable-next-line no-multi-assign
            this.error = this.info = this.debug = any => {
                console.log(this.constructor.format(any, false))
            }
        }
    }

    close() {
        if (this.constructor.production) {
            this.infoLog.close()
            this.errorLog.close()
        }
    }

    static format(any, finalNewLine = true) {
        let data

        if (typeof any !== 'object' || any === null) {
            data = any
        } else if (any instanceof HttpError) {
            const { code, message } = any

            data = message ? `${ any.code }: ${ any.message }` : code
        } else if (any instanceof Error) {
            const { name, message, stack } = any

            data = `${ name }: ${ message }\n${ stack }`
        } else {
            data = JSON.stringify(any)
        }

        return `[${ DateTime.now() }] ${ data }${ finalNewLine ? '\n' : '' }`
    }
}

Logger.writeStreamOptions = {
    flags: 'a',
    mode: 0o755,
    emitClose: true,
}

Logger.production = argv.production || process.env.NODE_ENV === 'production'

module.exports = Logger
