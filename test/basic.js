var concat = require('concat-stream')
var MultiStream = require('../')
var str = require('string-to-stream')
var test = require('tape')
var through = require('through')

test('combine streams', function (t) {
  var streams = [
    str('1'),
    str('2'),
    str('3')
  ]

  new MultiStream(streams)
    .on('error', function (err) {
      t.fail(err)
    })
    .pipe(concat(function (data) {
      t.equal(data.toString(), '123')
      t.end()
    }))
})

test('combine streams (classic)', function (t) {
  var streams = [
    through(),
    through(),
    through()
  ]

  new MultiStream(streams)
    .on('error', function (err) {
      t.fail(err)
    })
    .pipe(concat(function (data) {
      t.equal(data.toString(), '123')
      t.end()
    }))

  streams[0].end('1')
  streams[1].end('2')
  streams[2].end('3')
})

test('lazy stream creation', function (t) {
  var streams = [
    str('1'),
    function () {
      return str('2')
    },
    function () {
      return str('3')
    }
  ]

  new MultiStream(streams)
    .on('error', function (err) {
      t.fail(err)
    })
    .pipe(concat(function (data) {
      t.equal(data.toString(), '123')
      t.end()
    }))
})

test('lazy stream via generator', function (t) {
  var count = 0
  var streams = function () {
    if (count > 2) {
      return null
    }
    count++
    return str(count.toString())
  }

  new MultiStream(streams)
    .on('error', function (err) {
      t.fail(err)
    })
    .pipe(concat(function (data) {
      t.equal(data.toString(), '123')
      t.end()
    }))
})

test('lazy stream via generator (classic)', function (t) {
  var count = 0
  var streams = function () {
    if (count > 2) {
      return null
    }
    count++
    var s = through()
    process.nextTick(function () {
      s.write(count.toString())
      s.end()
    })
    return s
  }

  new MultiStream(streams)
    .on('error', function (err) {
      t.fail(err)
    })
    .pipe(concat(function (data) {
      t.equal(data.toString(), '123')
      t.end()
    }))
})
