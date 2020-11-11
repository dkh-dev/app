'use strict'

const { parse } = require('querystring')

const defineLazyProperty = require('./utils/define-lazy-property')
const { ips, ip } = require('./utils/ips')


class Request {
  constructor(req) {
    this.req = req

    const { url } = req
    const index = url.indexOf('?')

    this.path = index === -1 ? url : url.substr(0, index)
    this.search = index === -1 ? '' : url.substr(index)
  }

  // accessors

  get method() {
    return this.req.method
  }

  get url() {
    return this.req.url
  }

  get headers() {
    return this.req.headers
  }

  get body() {
    return this.req.body
  }

  get socket() {
    return this.req.socket
  }
}

defineLazyProperty(Request.prototype, 'query', {
  get() {
    return parse(this.search.substr(1))
  },
})

defineLazyProperty(Request.prototype, 'ips', {
  get() {
    return ips(this.req)
  },
})

defineLazyProperty(Request.prototype, 'ip', {
  get() {
    return ip(this.ips)
  },
})

module.exports = Request
