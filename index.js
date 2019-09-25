var stream = require('readable-stream')

function toStreams2Obj (s) {
  return toStreams2(s, { objectMode: true, highWaterMark: 16 })
}

function toStreams2Buf (s) {
  return toStreams2(s)
}

function toStreams2 (s, opts) {
  if (!s || typeof s === 'function' || s._readableState) return s

  var wrap = new stream.Readable(opts).wrap(s)
  if (s.destroy) {
    wrap.destroy = s.destroy.bind(s)
  }
  return wrap
}

class MultiStream extends stream.Readable {
  constructor (streams, opts) {
    super(opts)

    this.destroyed = false

    this._pending = 0
    this._current = null
    this._toStreams2 = (opts && opts.objectMode) ? toStreams2Obj : toStreams2Buf

    if (typeof streams === 'function') {
      this._queue = streams
    } else {
      this._queue = streams.map(this._toStreams2)
      this._queue.forEach(stream => {
        if (typeof stream !== 'function') this._attachErrorListener(stream)
      })
    }

    this._next()
  }

  _read (n) {
    if (this.destroyed || n === 0) {
      return
    }

    const chunk = this._current ? this._current.read() : null
    if (chunk != null) {
      this.push(chunk)
      this._pending = 0
    } else {
      this._pending = n
    }
  }

  destroy (err) {
    if (this.destroyed) return
    this.destroyed = true

    if (this._current && this._current.destroy) this._current.destroy()
    if (typeof this._queue !== 'function') {
      this._queue.forEach(stream => {
        if (stream.destroy) stream.destroy()
      })
    }

    if (err) this.emit('error', err)
    this.emit('close')
  }

  _next () {
    this._current = null

    if (typeof this._queue === 'function') {
      this._queue((err, stream) => {
        if (err) return this.destroy(err)
        stream = this._toStreams2(stream)
        this._attachErrorListener(stream)
        this._gotNextStream(stream)
      })
    } else {
      var stream = this._queue.shift()
      if (typeof stream === 'function') {
        stream = this._toStreams2(stream())
        this._attachErrorListener(stream)
      }
      this._gotNextStream(stream)
    }
  }

  _gotNextStream (stream) {
    if (!stream) {
      this.push(null)
      this.destroy()
      return
    }

    this._current = stream
    this._read(this._pending)

    const onReadable = () => {
      this._read(this._pending)
    }

    const onClose = () => {
      if (!stream._readableState.ended) {
        this.destroy()
      }
    }

    const onEnd = () => {
      this._current = null
      stream.removeListener('readable', onReadable)
      stream.removeListener('end', onEnd)
      stream.removeListener('close', onClose)
      this._next()
    }

    stream.on('readable', onReadable)
    stream.once('end', onEnd)
    stream.once('close', onClose)
  }

  _attachErrorListener (stream) {
    if (!stream) return

    const onError = (err) => {
      stream.removeListener('error', onError)
      this.destroy(err)
    }

    stream.once('error', onError)
  }
}

MultiStream.obj = streams => (
  new MultiStream(streams, { objectMode: true, highWaterMark: 16 })
)

module.exports = MultiStream
