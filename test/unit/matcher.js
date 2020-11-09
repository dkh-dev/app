'use strict'

const test = require('tape')

const { matcher } = require('../../lib/utils/matcher')


test('matches / exactly', t => {
  const match = matcher('/')

  t.ok(match('/'), 'exact /')

  t.notOk(match('/any'), 'should not match sub path')
  t.notOk(match('/any/any'), 'should not match sub path')
  t.notOk(match(''), 'should not match an empty string')
  t.notOk(match('any'), 'should not match a non-path string')
  t.notOk(match('/..'), 'invalid path /..')

  t.end()
})

test('matches /', t => {
  const match = matcher('/', false)

  t.ok(match('/'))
  t.ok(match('/any'))
  t.ok(match('/./any'))

  t.notOk(match('/..', 'invalid path /..'))
  t.notOk(match('/../any', 'invalid path /..'))
  t.notOk(match('/.../any', 'invalid path /...'))
  t.notOk(match(''), 'should not match an empty string')
  t.notOk(match('any'), 'should not match a non-path string')

  t.end()
})

test('matches /* exactly', t => {
  const match = matcher('/*')

  t.ok(match('/'))
  t.ok(match('/any'))

  t.notOk(match('/any/any'))
  t.notOk(match(''), 'should not match an empty string')
  t.notOk(match('any'), 'should not match a non-path string')

  t.end()
})

test('matches /*', t => {
  const match = matcher('/*', false)

  t.ok(match('/'))
  t.ok(match('/any'))
  t.ok(match('/any/any'))

  t.notOk(match(''), 'should not match an empty string')
  t.notOk(match('any'), 'should not match a non-path string')

  t.end()
})

test('matches /api exactly', t => {
  const match = matcher('/api')

  t.ok(match('/api'), 'exact /api')

  t.notOk(match('/'), 'should not match parent path')
  t.notOk(match('/api/'), 'should not match sub path')
  t.notOk(match('/api/any'), 'should not match sub path')
  t.notOk(match('/api/any/any'), 'should not match sub path')
  t.notOk(match(''), 'should not match an empty string')
  t.notOk(match('any'), 'should not match a non-path string')

  t.end()
})

test('matches /api', t => {
  const match = matcher('/api', false)

  t.ok(match('/api'))
  t.ok(match('/api/any'))
  t.ok(match('/api/./any'))

  t.notOk(match('/api/../any'), 'invalid path /api/..')
  t.notOk(match('/api-test', 'not a sub-path of /api'))
  t.notOk(match(''), 'should not match an empty string')
  t.notOk(match('any'), 'should not match a non-path string')

  t.end()
})

test('matches /api/ exactly', t => {
  const match = matcher('/api/')

  t.ok(match('/api/'), 'exact /api/')

  t.notOk(match('/'), 'should not match parent path')
  t.notOk(match('/api'), 'should not match path not ending with /')
  t.notOk(match('/api/any'), 'should not match sub path')
  t.notOk(match('/api/any/any'), 'should not match sub path')
  t.notOk(match(''), 'should not match an empty string')
  t.notOk(match('any'), 'should not match a non-path string')

  t.end()
})

test('matches /api/', t => {
  const match = matcher('/api/', false)

  t.ok(match('/api/'), 'exact /api/')
  t.ok(match('/api/any'), 'should not match sub path')
  t.ok(match('/api/any/any'), 'should not match sub path')

  t.notOk(match('/'), 'should not match parent path')
  t.notOk(match('/api'), 'should not match path not ending with /')
  t.notOk(match(''), 'should not match an empty string')
  t.notOk(match('any'), 'should not match a non-path string')

  t.end()
})

test('matches /:id exactly', t => {
  const match = matcher('/:id')

  t.eq(match('/1'), { id: '1' })

  t.notOk(match('/1/any'))
  t.notOk(match(''), 'should not match an empty string')
  t.notOk(match('any'), 'should not match a non-path string')

  t.end()
})

test('matches /:id/:action exactly', t => {
  const match = matcher('/:id/:action')

  t.eq(match('/1/update'), { id: '1', action: 'update' })

  t.notOk(match('/1/update/age'))
  t.notOk(match('/1'))

  t.end()
})

test('matches /:id/:action', t => {
  const match = matcher('/:id/:action', false)

  t.eq(match('/1/update'), { id: '1', action: 'update' })
  t.eq(match('/1/update/age'), { id: '1', action: 'update' })

  t.end()
})

test('matches /api/:id/:action exactly', t => {
  const match = matcher('/api/:id/:action')

  t.eq(match('/api/1/update'), { id: '1', action: 'update' })

  t.notOk(match('/api/1/update/age'))
  t.notOk(match('/api'))
  t.notOk(match('/api-test/1/update'))

  t.end()
})
