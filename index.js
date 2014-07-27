module.exports = MultiStream

var inherits = require('inherits')
var stream = require('stream')

inherits(MultiStream, stream.Readable)

function MultiStream (streams, opts) {
  if (!(this instanceof MultiStream)) return new MultiStream(streams, opts)
  stream.Readable.call(this, opts)

  this._drained = false
  this._forwarding = false
  this._current = null

  this._queue = streams
  this._next()
}

MultiStream.obj = function(streams) {
  return new MultiStream(streams, {objectMode:true, highWaterMark:16})
}

MultiStream.prototype._read = function () {
  this._drained = true
  this._forward()
}

MultiStream.prototype._forward = function() {
  if (this._forwarding || !this._drained) return
  this._forwarding = true

  var chunk
  while ((chunk = this._current.read()) !== null) {
    this._drained = this.push(chunk)
  }

  this._forwarding = false
}

MultiStream.prototype._next = function () {
  var self = this
  var stream = this._queue.shift()

  if (!stream) {
    this.push(null)
    return
  }

  this._current = stream

  stream.on('readable', onReadable)
  stream.on('end', onEnd)
  stream.on('error', onError)

  function onReadable () {
    self._forward()
  }

  function onEnd () {
    stream.removeListener('readable', onReadable)
    stream.removeListener('end', onEnd)
    stream.removeListener('error', onError)
    self._next()
  }

  function onError (err) {
    self.emit('error', err)
  }
}
