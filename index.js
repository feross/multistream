module.exports = MultiStream

var inherits = require('inherits')
var stream = require('stream')

inherits(MultiStream, stream.Readable)

function MultiStream (streams, opts) {
  if (!(this instanceof MultiStream)) return new MultiStream(streams, opts)
  stream.Readable.call(this, opts)

  this.destroyed = false

  this._queue = streams
  this._next()
}

MultiStream.prototype.destroy = function(err) {
  if (this.destroyed) return
  this.destroyed = true

  this._queue.forEach(function(stream) {
    if (stream.destroy) stream.destroy()
  })

  if (err) this.emit('error', err)
  this.emit('close')
}

MultiStream.prototype._read = function () {}

MultiStream.prototype._next = function () {
  var self = this
  var stream = this._queue.shift()

  if (!stream) {
    this.push(null)
    return
  }

  stream.on('readable', onReadable)
  stream.on('end', onEnd)
  stream.on('error', onError)
  stream.on('close', onClose)

  function onReadable () {
    var chunk
    while (chunk = stream.read()) {
      self.push(chunk)
    }
  }

  function onClose () {
    if (!stream._readableState.ended) {
      self.destroy()
    }
  }

  function onEnd () {
    stream.removeListener('readable', onReadable)
    stream.removeListener('end', onEnd)
    stream.removeListener('error', onError)
    stream.removeListener('close', onClose)
    self._next()
  }

  function onError (err) {
    self.destroy(err)
  }
}
