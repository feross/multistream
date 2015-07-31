# multistream [![travis][travis-image]][travis-url] [![npm][npm-image]][npm-url] [![downloads][downloads-image]][downloads-url]

[travis-image]: https://img.shields.io/travis/feross/multistream.svg?style=flat
[travis-url]: https://travis-ci.org/feross/multistream
[npm-image]: https://img.shields.io/npm/v/multistream.svg?style=flat
[npm-url]: https://npmjs.org/package/multistream
[downloads-image]: https://img.shields.io/npm/dm/multistream.svg?style=flat
[downloads-url]: https://npmjs.org/package/multistream

#### A stream that emits multiple other streams one after another (streams2)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/magnet-uri.svg)](https://saucelabs.com/u/magnet-uri)

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

Alternativelly, streams may be created by a generator function:

```js
var count = 0;
var streams = function () {
  if (count > 3) return false
  count++
  return fs.createReadStream(__dirname + '/numbers/' + count + '.txt')
}

MultiStream(streams).pipe(process.stdout) // => 123
```


### contributors

- [Feross Aboukhadijeh](http://feross.org)
- [Mathias Buus](https://github.com/mafintosh/)
- [Yuri Astrakhan](https://github.com/nyurik/)

### license

MIT. Copyright (c) [Feross Aboukhadijeh](http://feross.org).
