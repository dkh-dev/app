'use strict'

const trusted = [ '127.0.0.1', '::ffff:127.0.0.1', '::1' ]

const forwarded = header => {
  if (!header) {
    return []
  }

  const ips = []
  let end = header.length
  let start = end

  for (let i = end - 1; i >= 0; i--) {
    switch (header.charCodeAt(i)) {
      case 32:
        if (start === end) {
          start = i
          end = i
        }
        break
      case 44:
        if (start !== end) {
          ips.push(header.substring(start, end))
        }
        start = i
        end = i
        break
      default:
        start = i
    }
  }

  if (start !== end) {
    ips.push(header.substring(start, end))
  }

  return ips
}

const ips = req => {
  const ips = forwarded(req.headers[ 'x-forwarded-for' ])

  ips.unshift(req.socket.remoteAddress)

  return ips
}

const ip = ips => {
  const [ ip ] = ips

  return ips.length > 1 && trusted.includes(ip) ? ips[ 1 ] : ip
}

module.exports = {
  trusted,
  forwarded,
  ips,
  ip,
}
