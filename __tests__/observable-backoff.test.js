/* eslint-env jest */
const Observable = require('rxjs/Observable').Observable
const Subscription = require('rxjs/Subscription').Subscription
const StaticObservable = require('static-observable')
const timeout = require('timeout-then')
require('observable-backoff')

describe('observable-backoff', () => {
  describe('no errors', () => {
    it('should work like a normal observable', () => {
      const observable = new StaticObservable()
      const callbacks = {
        onNext: jest.fn(),
        onError: jest.fn(),
        onComplete: jest.fn()
      }
      observable
        .backoff()
        .subscribe(
          callbacks.onNext,
          callbacks.onError,
          callbacks.onComplete
        )
      observable.next(1)
      expect(callbacks).toMatchSnapshot()
      observable.next(2)
      expect(callbacks).toMatchSnapshot()
      observable.next(3)
      expect(callbacks).toMatchSnapshot()
      observable.complete()
      expect(callbacks).toMatchSnapshot()
    })
  })

  describe('errors', () => {
    it('should exponentially backoff and retry', () => {
      const mocks = {
        onNext: jest.fn(),
        onError: jest.fn(),
        onComplete: jest.fn(),
        subscribe: jest.fn(),
        optsOnError: jest.fn()
      }
      let failCount = 0
      const subscribe = (observer) => {
        mocks.subscribe(observer.constructor.name) // for snapshot
        observer.error(failCount)
        failCount++
        return new Subscription()
      }
      const observable = new Observable(subscribe)
      const opts = {
        // 5, 10, 20
        minTimeout: 5,
        maxTimeout: 10 * Math.pow(2, 2),
        factor: 2,
        retries: 2,
        onError: mocks.optsOnError
      }
      observable
        .backoff(opts)
        .subscribe(
          mocks.onNext,
          mocks.onError,
          mocks.onComplete
        )
      return timeout(0)
        .then(() => expect(mocks).toMatchSnapshot())
        .then(() => timeout(5 + 1))
        .then(() => expect(mocks).toMatchSnapshot())
        .then(() => timeout(10 + 1))
        .then(() => expect(mocks).toMatchSnapshot())
        .then(() => timeout(20 + 1)) // extra to ensure it doesn't retry too many times
        .then(() => expect(mocks).toMatchSnapshot())
    })
    it('should exponentially backoff and stop if onError returns true', () => {
      const mocks = {
        onNext: jest.fn(),
        onError: jest.fn(),
        onComplete: jest.fn(),
        subscribe: jest.fn(),
        optsOnError: jest.fn(function (err, final, count) {
          const dontRetry = count === 3
          return dontRetry
        })
      }
      let failCount = 0
      const subscribe = (observer) => {
        mocks.subscribe(observer.constructor.name) // for snapshot
        observer.error(failCount)
        failCount++
        return new Subscription()
      }
      const observable = new Observable(subscribe)
      const opts = {
        // 5, 10, 20
        minTimeout: 5,
        maxTimeout: 10 * Math.pow(2, 2),
        factor: 2,
        retries: 2,
        onError: mocks.optsOnError
      }
      observable
        .backoff(opts)
        .subscribe(
          mocks.onNext,
          mocks.onError,
          mocks.onComplete
        )
      return timeout(0)
        .then(() => expect(mocks).toMatchSnapshot())
        .then(() => timeout(5 + 1))
        .then(() => expect(mocks).toMatchSnapshot())
        .then(() => timeout(10 + 1)) // stopped retrying..
        .then(() => expect(mocks).toMatchSnapshot())
        .then(() => timeout(20 + 1))
        .then(() => expect(mocks).toMatchSnapshot())
    })
  })
})
