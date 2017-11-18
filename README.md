# observable-backoff [![Build Status](https://travis-ci.org/tjmehta/observable-backoff.svg?branch=master)](https://travis-ci.org/tjmehta/observable-backoff) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)
RxJS observable exponential backoff operator

# Installation
```bash
npm i --save observable-backoff
npm i --save rxjs # peer dependency
```

# Usage
Example: exponential backoff
```js
var Observable = require('rxjs/Observable').Observable
var Subscription = require('rxjs/Subscription').Subscription
require('observable-backoff')
var trace = function (msg) {
  console.log('trace', '-', Date.now(), '-', msg)
}

// create an observable..
var timerObservable = new Observable(function (observer) {
  trace('subscribe')
  var count = 0
  // setup timer counter
  var interval = setInterval(function () {
    observer.next(count++)
  }, 1000)
  // setup a hard-coded error after 3.5 sec..
  setTimeout(function () {
    observer.error(new Error('boom'))
  }, 3500)
  // return subscription
  return new Subscription(function () {
    trace('unsubscribe')
    clearInterval(interval)
  })
})

// make it exponentially backoff on error
var opts = {
  minTimeout: 1000,
  maxTimeout: 3000,
  factor: 3,
  retries: 2
  onError: function (err, isFinal, count) {
    // you could log every error here
  }
}
timerObservable = timerObservable.backoff(opts)

// subscribe, start timer
timerObservable(
  function (next) {
    trace('next: ' + next)
  },
  function (err) {
    trace('error: ' + err)
  }
  function () {
    trace('completed')
  }
)

/** LOG
trace - 1469418557021 - subscribe
trace - 1469418558029 - next: 0
trace - 1469418559034 - next: 1
trace - 1469418560037 - next: 2
trace - 1469418560529 - unsubscribe
// 1000ms delay before retry
trace - 1469418561538 - subscribe
trace - 1469418562544 - next: 0
trace - 1469418563550 - next: 1
trace - 1469418564554 - next: 2
trace - 1469418565043 - unsubscribe
// 3000ms delay before retry
trace - 1469418568049 - subscribe
trace - 1469418569052 - next: 0
trace - 1469418570057 - next: 1
trace - 1469418571061 - next: 2
trace - 1469418571553 - unsubscribe
trace - 1469418571554 - error: Error: boom
*/
```

# License
MIT
