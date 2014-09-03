var concat = require('concat-stream')
var MultiStream = require('../')
var str = require('string-to-stream')
var test = require('tape')
var through = require('through')

test('combine streams', function (t) {
  var streams = [
    new str('1'),
    new str('2'),
    new str('3')
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

test('combine streams (classic)', function(t) {
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
    new str('1'),
    function() {
      return new str('2')
    },
    function() {
      return new str('3')
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
