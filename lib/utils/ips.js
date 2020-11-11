'use strict'

const trusted = [ '127.0.0.1', '::ffff:127.0.0.1', '::1' ]

const forwarded = req => {
  const header = req.headers[ 'x-forwarded-for' ]

  if (!header) {
    return []
  }

  const forwarded = header.split(',')
  const ips = []

  for (let i = forwarded.length - 1; i >= 0; i--) {
    const ip = forwarded[ i ].trim()

    if (ip) {
      ips.push(ip)
    }
  }

  return ips
}

const ips = req => {
  const ips = forwarded(req)

  ips.unshift(req.socket.remoteAddress)

  return ips
}

const ip = ips => {
  const [ ip ] = ips

  return ips.length > 1 && trusted.includes(ip) ? ips[ 1 ] : ip
}

module.exports = {
  trusted,
  ips,
  ip,
}
