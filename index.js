module.exports = MultiStream

var inherits = require('inherits')
var ReadableStream = require('stream').Readable
var ClientRequest = require('http').ClientRequest
ClientRequest || (ClientRequest = function () {}) // browser hack

function isHTTPStream (stream) {
  return stream && (stream instanceof ClientRequest || (stream._opts && stream._opts.method && stream._opts.path && stream._opts.url)) // browser hack
}

inherits(MultiStream, ReadableStream)

function MultiStream (streams, opts) {
  if (!(this instanceof MultiStream)) return new MultiStream(streams, opts)
  ReadableStream.call(this, opts)

  this.destroyed = false

  this._drained = false
  this._forwarding = false
  this._current = null
  this._queue = (typeof streams === 'function' ? streams : streams.map(toStreams2))

  this._next()
}

MultiStream.obj = function (streams) {
  return new MultiStream(streams, { objectMode: true, highWaterMark: 16 })
}

MultiStream.prototype._read = function () {
  this._drained = true
  this._forward()
}

MultiStream.prototype._forward = function () {
  if (this._forwarding || !this._drained || !this._current) return
  this._forwarding = true

  var chunk
  while ((chunk = this._current.read()) !== null) {
    this._drained = this.push(chunk)
  }

  this._forwarding = false
}

MultiStream.prototype.destroy = function (err) {
  if (this.destroyed) return
  this.destroyed = true

  if (this._current && this._current.destroy) this._current.destroy()
  if (typeof this._queue !== 'function') {
    this._queue.forEach(function (stream) {
      if (stream.destroy) stream.destroy()
    })
  }

  if (err) this.emit('error', err)
  this.emit('close')
}

MultiStream.prototype._next = function () {
  var self = this
  self._current = null

  if (typeof self._queue === 'function') {
    self._queue(function (err, stream) {
      if (err) return self.destroy(err)
      self._gotNextStream(toStreams2(stream))
    })
  } else {
    var stream = self._queue.shift()
    if (typeof stream === 'function') stream = toStreams2(stream())
    self._gotNextStream(stream)
  }
}

MultiStream.prototype._gotNextStream = function (stream) {
  var self = this

  if (!stream) {
    self.push(null)
    self.destroy()
    return
  }

  if (isHTTPStream(stream)) {
    stream.on('response', function (res) {
      self._gotNextStream(toStreams2(res))
    }).end()
  } else {
    self._current = stream
    self._forward()

    stream.on('readable', onReadable)
    stream.on('end', onEnd)
    stream.on('error', onError)
    stream.on('close', onClose)
  }

  function onReadable () {
    self._forward()
  }

  function onClose () {
    if (!stream._readableState.ended) {
      self.destroy()
    }
  }

  function onEnd () {
    self._current = null
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

function toStreams2 (s) {
  if (!s || typeof s === 'function' || s._readableState || isHTTPStream(s)) return s

  var wrap = new ReadableStream().wrap(s)
  if (s.destroy) {
    wrap.destroy = s.destroy.bind(s)
  }
  return wrap
}
