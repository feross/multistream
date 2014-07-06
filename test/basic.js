var concat = require('concat-stream')
var fs = require('fs')
var MultiStream = require('../')
var test = require('tape')

test('combine fs streams', function (t) {
  var streams = [
    fs.createReadStream(__dirname + '/numbers/1.txt'),
    fs.createReadStream(__dirname + '/numbers/2.txt'),
    fs.createReadStream(__dirname + '/numbers/3.txt')
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
