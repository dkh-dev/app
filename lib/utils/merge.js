'use strict'

const each = require('./each')
const { object } = require('./is')


const merge = (target, source) => {
  if (!object(source)) {
    return target
  }

  each(source, (source, key) => {
    if (object(target[ key ])) {
      // if the current target property is an object
      // merge source property into it
      merge(target[ key ], source)
    } else {
      // otherwise, set the target property directly
      target[ key ] = source
    }
  })

  return target
}

module.exports = merge
