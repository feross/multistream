# multistream [![travis](https://img.shields.io/travis/feross/multistream.svg)](https://travis-ci.org/feross/multistream) [![npm](https://img.shields.io/npm/v/multistream.svg)](https://npmjs.org/package/multistream)

#### A stream that emits multiple other streams one after another (streams2)

[![browser support](https://ci.testling.com/feross/multistream.png)](https://ci.testling.com/feross/multistream)

![cat](https://raw.githubusercontent.com/feross/multistream/master/img.jpg)

Simple, robust streams2 version of [combined-stream](https://www.npmjs.org/package/combined-stream). Allows you to combine multiple streams into a single stream. When the first stream ends, the next one starts, and so on, until all streams are consumed.

This module is used by [WebTorrent](http://webtorrent.io), specifically [create-torrent](https://github.com/feross/create-torrent).

### install

```
npm install multistream
```

### usage

Use `multistream` like this:

```js
var MultiStream = require('multistream')
var concat = require('concat-stream')
var fs = require('fs')

var streams = [
  fs.createReadStream(__dirname + '/numbers/1.txt'),
  fs.createReadStream(__dirname + '/numbers/2.txt'),
  fs.createReadStream(__dirname + '/numbers/3.txt')
]

MultiStream(streams).pipe(process.stdout) // => 123
```

To lazily create the streams, wrap them in a function:

```js
var streams = [
  fs.createReadStream(__dirname + '/numbers/1.txt'),
  function () { // will be executed when the stream is active
    return fs.createReadStream(__dirname + '/numbers/2.txt')
  },
  function () { // same
    return fs.createReadStream(__dirname + '/numbers/3.txt')
  }
]

MultiStream(streams).pipe(process.stdout) // => 123
```

### contributors

- [Feross Aboukhadijeh](http://feross.org)
- [Mathias Buus](https://github.com/mafintosh/)

### license

MIT. Copyright (c) [Feross Aboukhadijeh](http://feross.org).
