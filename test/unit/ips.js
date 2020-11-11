'use strict'

const test = require('tape')
const { forwarded, ip } = require('../../lib/utils/ips')


test('parse x-forwarded-for header', t => {
  t.eq(forwarded('1.1.1.1,2.2.2.2'), [ '2.2.2.2', '1.1.1.1' ])
  t.eq(forwarded('1.1.1.1, 2.2.2.2'), [ '2.2.2.2', '1.1.1.1' ])
  t.eq(forwarded(' , , client,,p1 , p2, '), [ 'p2', 'p1', 'client' ])

  t.eq(forwarded(void 0), [], 'empty header')
  t.eq(forwarded(''), [], 'empty header')

  t.end()
})

test('ip', t => {
  t.equal(ip([ '2.2.2.2', '1.1.1.1' ]), '2.2.2.2')
  t.equal(ip([ '127.0.0.1', '2.2.2.2', '1.1.1.1' ]), '2.2.2.2', 'trusts local')

  t.end()
})
