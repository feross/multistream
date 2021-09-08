const concat = require('simple-concat')
const MultiStream = require('../')
const str = require('string-to-stream')
const test = require('tape')
const through = require('through')

test('combine streams', function (t) {
  const streams = [
    str('1'),
    str('2'),
    str('3')
  ]

  const stream = new MultiStream(streams)
    .on('error', function (err) {
      t.fail(err)
    })

  concat(stream, function (err, data) {
    t.error(err)
    t.equal(data.toString(), '123')
    t.end()
  })
})

test('combine streams (classic)', function (t) {
  const streams = [
    through(),
    through(),
    through()
  ]

  const stream = new MultiStream(streams)
    .on('error', function (err) {
      t.fail(err)
    })

  concat(stream, function (err, data) {
    t.error(err)
    t.equal(data.toString(), '123')
    t.end()
  })

  streams[0].end('1')
  streams[1].end('2')
  streams[2].end('3')
})

test('lazy stream creation', function (t) {
  const streams = [
    str('1'),
    function () {
      return str('2')
    },
    function () {
      return str('3')
    }
  ]

  const stream = new MultiStream(streams)
    .on('error', function (err) {
      t.fail(err)
    })

  concat(stream, function (err, data) {
    t.error(err)
    t.equal(data.toString(), '123')
    t.end()
  })
})

test('lazy stream via factory', function (t) {
  let count = 0
  function factory (cb) {
    if (count > 2) return cb(null, null)
    count++
    setTimeout(function () {
      cb(null, str(count.toString()))
    }, 0)
  }

  const stream = new MultiStream(factory)
    .on('error', function (err) {
      t.fail(err)
    })

  concat(stream, function (err, data) {
    t.error(err)
    t.equal(data.toString(), '123')
    t.end()
  })
})

test('lazy stream via factory (factory returns error)', function (t) {
  t.plan(2)
  let count = 0
  function factory (cb) {
    if (count > 2) return cb(new Error('factory error'))
    count++
    setTimeout(function () {
      cb(null, str(count.toString()))
    }, 0)
  }

  new MultiStream(factory)
    .on('error', function (err) {
      t.pass('got error', err)
    })
    .on('close', function () {
      t.pass('got close')
    })
    .resume()
})

test('lazy stream via factory (classic)', function (t) {
  let count = 0
  function factory (cb) {
    if (count > 2) return cb(null, null)
    count++
    const s = through()
    process.nextTick(function () {
      s.write(count.toString())
      s.end()
    })
    cb(null, s)
  }

  const stream = new MultiStream(factory)
    .on('error', function (err) {
      t.fail(err)
    })

  concat(stream, function (err, data) {
    t.error(err)
    t.equal(data.toString(), '123')
    t.end()
  })
})

test('throw immediate error', function (t) {
  t.plan(1)

  const streams = [
    str('1'),
    through() // will emit 'error'
  ]

  new MultiStream(streams).on('error', function (err) {
    t.ok(err instanceof Error, 'got expected error')
  })

  streams[1].emit('error', new Error('immediate error!'))
})

test('async iterator', function (t) {

  async function * generate () {
    yield str('1')
    yield str('2')
    yield str('3')
  }

  const stream = new MultiStream(generate())
    .on('error', function (err) {
      t.fail(err)
    })

  concat(stream, function (err, data) {
    t.error(err)
    t.equal(data.toString(), '123')
    t.end()
  })
})