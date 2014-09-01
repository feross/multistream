var concat = require('concat-stream')
var through = require('through')
var inherits = require('inherits')
var MultiStream = require('../')
var stream = require('stream')
var test = require('tape')

inherits(StringStream, stream.Readable)

function StringStream (str) {
  stream.Readable.call(this)
  this._str = str
}

StringStream.prototype._read = function(n) {
  if (!this.ended) {
    var self = this
    process.nextTick(function () {
      self.push(new Buffer(self._str))
      self.push(null)
    })
    this.ended = true
  }
}

test('combine streams', function (t) {
  var streams = [
    new StringStream('1'),
    new StringStream('2'),
    new StringStream('3')
  ]

  MultiStream(streams)
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

  MultiStream(streams)
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
    new StringStream('1'),
    function() {
      return new StringStream('2')
    },
    function() {
      return new StringStream('3')
    }
  ]

  MultiStream(streams)
    .on('error', function (err) {
      t.fail(err)
    })
    .pipe(concat(function (data) {
      t.equal(data.toString(), '123')
      t.end()
    }))
})

test('combine with array', function (t) {
  var streams = [
    ['1','2','3'],
    ['4','5','6']
  ]

  MultiStream(streams)
    .on('error', function (err) {
      t.fail(err)
    })
    .pipe(concat(function (data) {
      t.equal(data.toString(), '123456')
      t.end()
    }))
})
