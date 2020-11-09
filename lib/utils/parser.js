'use strict'

const { parse } = require('querystring')

const HttpError = require('./http-error')


const getContentLength = req => {
  const length = req.headers[ 'content-length' ]

  if (length === void 0) {
    return null
  }

  const number = Number(length)

  if (number.toString() !== length) {
    throw new HttpError(400, `invalid content-length ${ length }`)
  }

  return number
}

const getContentType = req => {
  const type = req.headers[ 'content-type' ]

  return type
}

const reader = limit => req => {
  const length = getContentLength(req)

  if (length !== null && length > limit) {
    throw new HttpError(413, `content length has exceeded the limit of ${ limit }`)
  }

  return new Promise((resolve, reject) => {
    const chunks = []
    let received = 0
    // eslint-disable-next-line prefer-const
    let cleanup

    const end = err => {
      cleanup()

      if (err) {
        return void reject(err)
      }

      if (length !== null && received !== length) {
        return void reject(new HttpError(400, 'invalid request size'))
      }

      resolve(Buffer.concat(chunks))
    }

    const push = chunk => {
      received += chunk.length

      if (received > limit) {
        return void end(new HttpError(413, `limit of ${ limit } exceeded`))
      }

      chunks.push(chunk)
    }

    const aborted = () => end(new HttpError(400, 'request aborted'))

    req
      .on('aborted', aborted)
      .on('error', end)
      .on('end', end)
      .on('data', push)

    cleanup = () => req
      .off('aborted', aborted)
      .off('error', end)
      .off('end', end)
      .off('data', push)
  })
}

// accepts a content-type
const only = type => req => getContentType(req) === type


const parser = (type, parse) => ({ limit: l }) => {
  const accept = only(type)
  const read = reader(l)

  return async ({ req }) => {
    if (!accept(req)) {
      return
    }

    req.body = await parse(await read(req))
  }
}


const json = parser('application/json', JSON.parse)
const urlencoded = parser('application/x-www-form-urlencoded', parse)
const raw = parser('application/octet-stream', buffer => buffer)


module.exports = {
  reader,
  parser,
  parsers: {
    json,
    urlencoded,
    raw,
  },
}
