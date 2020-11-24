const MultiStream = require('../')
const ary = require('array-to-stream')
const test = require('tape')

test('combine object streams', function (t) {
  const objects = [true, { x: 'b' }, 'c', 'd', 'e', 'f']

  const streams = [
    ary(objects.slice(0, 2)),
    ary(objects.slice(2, 3)),
    ary(objects.slice(3))
  ]

  const received = []
  MultiStream.obj(streams)
    .on('error', function (err) {
      t.fail(err)
    })
    .on('data', function (object) {
      received.push(object)
    })
    .on('end', function () {
      t.same(objects, received)
      t.end()
    })
})
