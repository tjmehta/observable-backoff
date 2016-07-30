'use strict'

var defaults = require('101/defaults')
var noop = require('101/noop')
var Observable = require('rxjs/Observable').Observable
var StaticObservable = require('static-observable')
// observable factories
require('rxjs/add/observable/range')
require('rxjs/add/observable/zip')
// operators
require('rxjs/add/operator/delay')
require('rxjs/add/operator/mergeMap')
require('rxjs/add/operator/retryWhen')

var debug = console.log.bind(console)

/**
 * exponential backoff operator
 * @return {[type]} [description]
 */
Observable.prototype.backoff = function (opts) {
  defaults(opts, {
    minTimeout: 1000,
    maxTimeout: 3000,
    factor: 3,
    retries: 2,
    onError: noop
  })
  return this.retryWhen(function (errorObs) {
    return Observable.zip(
      Observable.range(0, opts.retries + 1),
      errorObs
    ).mergeMap(function (zip) {
      var i = zip[0]
      var err = zip[1]
      opts.onError(err, i === opts.retries, i)
      if (i === opts.retries) {
        return StaticObservable.error(err)
      }
      var timeout = Math.min(
        opts.minTimeout * Math.pow(opts.factor, i),
        opts.maxTimeout
      )
      return StaticObservable.next(i).delay(timeout)
    })
  })
}
