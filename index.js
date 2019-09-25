var stream = require('readable-stream')
var Transform = stream.Transform
var pump = stream.pipeline
var once = require('once')

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

class MultiStream extends Transform {
  constructor (streams, opts) {
    super({ ...opts, autoDestroy: true })

    this._current = null
    this._toStreams2 = (opts && opts.objectMode) ? toStreams2Obj : toStreams2Buf

    if (typeof streams === 'function') {
      this._queue = streams
    } else {
      this._queue = streams.map(this._toStreams2)
      this._queue.forEach(stream => {
        if (typeof stream !== 'function') {
          stream.once('error', err => destroy(this, err))
        }
      })
    }

    this._next()
  }

  _destroy (err, cb) {
    let streams = []
    if (this._current) streams.push(this._current)
    if (typeof this._queue !== 'function') streams = streams.concat(this._queue)

    if (streams.length === 0) {
      cb(err)
    } else {
      let counter = streams.length
      let er = err
      streams.forEach(stream => {
        destroy(stream, err, err => {
          er = er || err
          if (--counter === 0) {
            cb(er)
          }
        })
      })
    }
  }

  _transform (data, encoding, cb) {
    cb(null, data)
  }

  _next () {
    this._current = null

    if (typeof this._queue === 'function') {
      this._queue((err, stream) => {
        if (err) return this.destroy(err)
        stream = this._toStreams2(stream)
        this._gotNextStream(stream)
      })
    } else {
      var stream = this._queue.shift()
      if (typeof stream === 'function') {
        stream = this._toStreams2(stream())
      }
      this._gotNextStream(stream)
    }
  }

  end () {
    // pump does not have a ´{ end: false }` option.
    this._next()
  }

  _gotNextStream (stream) {
    if (!stream) {
      Transform.prototype.end.call(this)
      return
    }

    this._current = stream
    pump(this._current, this, err => {
      if (err) {
        destroy(this, err)
      }
    })
  }
}

MultiStream.obj = streams => (
  new MultiStream(streams, { objectMode: true, highWaterMark: 16 })
)

module.exports = MultiStream

// Normalize stream destroy w/ callback.
function destroy (stream, err, cb) {
  if (!stream.destroy || stream.destroyed) {
    if (cb) {
      cb(err)
    } else if (err) {
      // Propagate error
      stream.destroy(err)
    }
  } else if (cb) {
    const callback = once(er => cb(er || err))
    stream
      .on('error', callback)
      .on('close', callback)
      .destroy(err, callback)
  } else {
    stream.destroy(err)
  }
}
