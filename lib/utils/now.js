'use strict'

const padStart = (value, length = 2) => String(value).padStart(length, '0')
const padEnd = (value, length = 3) => String(value).padEnd(length, '0')

const now = () => {
  const date = new Date()

  const yyyy = date.getFullYear()
  const MM = padStart(date.getMonth() + 1)
  const dd = padStart(date.getDate())

  const hh = padStart(date.getHours())
  const mm = padStart(date.getMinutes())
  const ss = padStart(date.getSeconds())
  const sss = padEnd(date.getMilliseconds())

  return `${ yyyy }-${ MM }-${ dd } ${ hh }:${ mm }:${ ss }.${ sss }`
}

module.exports = now
