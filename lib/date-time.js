'use strict'

class DateTime {
    static now() {
        const date = new Date()

        const yyyy = date.getFullYear()
        const MM = this.padStart(date.getMonth() + 1)
        const dd = this.padStart(date.getDate())

        const hh = this.padStart(date.getHours())
        const mm = this.padStart(date.getMinutes())
        const ss = this.padStart(date.getSeconds())
        const sss = this.padEnd(date.getMilliseconds())

        return `${ yyyy }-${ MM }-${ dd } ${ hh }:${ mm }:${ ss }.${ sss }`

    }

    static padStart(num, maxLength = 2) {
        return num.toString().padStart(maxLength, '0')
    }

    static padEnd(num, maxLength = 3) {
        return num.toString().padEnd(maxLength, '0')
    }
}

module.exports = DateTime
