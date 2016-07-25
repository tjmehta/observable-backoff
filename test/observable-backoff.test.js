'use strict'

var noop = require('101/noop')
var Observable = require('rxjs/Observable').Observable
var Subscription = require('rxjs/Subscription').Subscription
var sinon = require('sinon')
var StaticObservable = require('static-observable')

require('../index.js')

var afterEach = global.afterEach
var beforeEach = global.beforeEach
var describe = global.describe
var it = global.it

describe('observable-backoff', function () {
  beforeEach(function () {
    this.clock = sinon.useFakeTimers()
  })
  afterEach(function () {
    this.clock.restore()
  })

  describe('error observable', function () {
    beforeEach(function () {
      var self = this
      this.err = new Error('boom')
      // observable
      this.unsubscribe = sinon.spy(noop)
      this.subscribe = sinon.spy(function (observer) {
        setTimeout(function () {
          observer.error(self.err)
        }, 0)
        return new Subscription(self.unsubscribe)
      })
      this.observable = new Observable(this.subscribe)
      // callbacks
      this.onNext = sinon.stub()
      this.onError = sinon.stub()
      this.onCompleted = sinon.stub()
    })

    it('should retry w/ exponential backoff', function () {
      var self = this
      var opts = {
        minTimeout: 1000,
        maxTimeout: 3000,
        factor: 3,
        retries: 2,
        onError: sinon.stub()
      }
      this.observable.backoff(opts).subscribe(
        this.onNext,
        this.onError,
        this.onCompleted
      )
      // observable assertions
      sinon.assert.calledOnce(this.subscribe)
      sinon.assert.notCalled(this.unsubscribe)
      this.clock.tick(1)
      sinon.assert.calledOnce(self.unsubscribe)
      sinon.assert.calledOnce(opts.onError)
      sinon.assert.calledWith(opts.onError, this.err, false, 0)
      this.clock.tick(1000)
      sinon.assert.calledTwice(self.subscribe)
      this.clock.tick(1)
      sinon.assert.calledTwice(self.unsubscribe)
      sinon.assert.calledTwice(opts.onError)
      sinon.assert.calledWith(opts.onError, this.err, false, 1)
      this.clock.tick(1000)
      sinon.assert.calledTwice(self.subscribe)
      this.clock.tick(1000)
      sinon.assert.calledTwice(self.subscribe)
      this.clock.tick(1000)
      sinon.assert.calledThrice(self.subscribe)
      this.clock.tick(1)
      sinon.assert.calledThrice(self.unsubscribe)
      sinon.assert.calledThrice(opts.onError)
      sinon.assert.calledWith(opts.onError, this.err, true, 2)
      // callback assertions
      sinon.assert.notCalled(this.onNext)
      sinon.assert.notCalled(this.onCompleted)
      sinon.assert.calledOnce(this.onError)
      sinon.assert.calledWith(this.onError, this.err)
    })
  })
})