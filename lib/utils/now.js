'use strict'

const pad = (value, length = 2) => String(value).padStart(length, '0')
const padEnd = (value, length = 3) => String(value).padEnd(length, '0')

const now = () => {
  const date = new Date()

  const yyyy = date.getFullYear()
  const MM = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())

  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  const ss = pad(date.getSeconds())
  const sss = padEnd(date.getMilliseconds())

  return `${ yyyy }-${ MM }-${ dd } ${ hh }:${ mm }:${ ss }.${ sss }`
}

module.exports = now
