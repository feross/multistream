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

test('combine streams (http)', function (t) {
  var streams = [
    str('1'),
    require('https').request('https://avatars1.githubusercontent.com/u/2401029?s=100'),
    str('2'),
    require('https').request('https://avatars1.githubusercontent.com/u/1024980?s=100')
  ]
  var i = 0
  new MultiStream(streams)
    .on('error', function (err) {
      t.fail(err)
    })
    .on('data', function (data) {
      i++
      if (i === 1) {
        t.equal(data.toString(), '1')
      } else if (i === 3) {
        t.equal(data.toString(), '2')
      } else if (i === 2 || i === 4) {
        t.ok((data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF), 'should be jpg') // magic number
      }
    }).on('end', function () {
      t.end()
    })
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

test('lazy stream via factory', function (t) {
  var count = 0
  function factory (cb) {
    if (count > 2) return cb(null, null)
    count++
    setTimeout(function () {
      cb(null, str(count.toString()))
    }, 0)
  }

  new MultiStream(factory)
    .on('error', function (err) {
      t.fail(err)
    })
    .pipe(concat(function (data) {
      t.equal(data.toString(), '123')
      t.end()
    }))
})

test('lazy stream via factory (factory returns error)', function (t) {
  t.plan(2)
  var count = 0
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
  var count = 0
  function factory (cb) {
    if (count > 2) return cb(null, null)
    count++
    var s = through()
    process.nextTick(function () {
      s.write(count.toString())
      s.end()
    })
    cb(null, s)
  }

  new MultiStream(factory)
    .on('error', function (err) {
      t.fail(err)
    })
    .pipe(concat(function (data) {
      t.equal(data.toString(), '123')
      t.end()
    }))
})
