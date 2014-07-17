var concat = require('concat-stream')
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
