'use strict'

const each = require('./utils/each')

class Response {
  constructor(res) {
    this.res = res

    this.continuing = false
  }

  get finished() {
    return this.res.writableEnded
  }

  get writableEnded() {
    return this.res.writableEnded
  }

  get writable() {
    return !this.res.writableEnded
  }

  status(status) {
    if (!this.headerSent) {
      this.res.statusCode = status
    }

    return this
  }

  set(name, value) {
    if (!this.headerSent) {
      if (value === void 0) {
        each(name, (value, name) => this.res.setHeader(name, value))
      } else {
        this.res.setHeader(name, value)
      }
    }

    return this
  }

  remove(name) {
    if (!this.headerSent) {
      this.res.removeHeader(name)
    }

    return this
  }

  has(name) {
    return this.res.hasHeader(name)
  }

  write(data) {
    if (this.writable) {
      this.res.write(data)
    }

    return this
  }

  continue(continuing = true) {
    this.continuing = continuing

    return this
  }

  // accessors

  get headerSent() {
    return this.res.headerSent
  }

  get socket() {
    return this.res.socket
  }

  end(data) {
    if (this.continuing) {
      return
    }

    this.res.end(data)
  }
}

module.exports = Response
