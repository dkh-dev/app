'use strict'

const test = require('tape')

const defineLazyProperty = require('../../lib/utils/define-lazy-property')


test('defineLazyProperty', t => {
  const object = {}

  t.plan(4)

  defineLazyProperty(object, 'one', {
    get: () => {
      t.pass('initialize .one')

      return 1
    },
  })

  defineLazyProperty(object, 'two', {
    get: () => {
      t.fail(`.two should've been explicitly set`)

      return 2
    },
  })

  object.two = 2

  t.equals(object.one, 1)
  t.equals(object.one, 1, '.one has already been initialized')
  t.equals(object.two, 2)
})
