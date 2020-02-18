const PENDING = 0
const FULFILLED = 1
const REJECTED = 2

/**
 * check if a value is a promise, if it is,
 * return "then" method for that promise
 *
 * @param {Promise|Any} value
 * @return {Function|Null}
 */
function getThen(value) {
  const t = typeof value
  if (value && (t === 'object' || t === 'function')) {
    const then = value.then
    if (typeof then === 'function') {
      return then
    }
  }
  return null
}

/**
 * takes a potenially misbehaving resolver function and
 * make sure onFulfilled and onRejected are only called once.
 *
 * @parma {Function} fn A resolver function we cant trust
 * @param {Function} onFulfilled
 * @param {Function} onRejected
 */
function doResolve(fn, onFulfilled, onRejected) {
  let done = false
  try {
    fn(function(value) {
      if (done) return
      done = true
      onFulfilled(value)
    }, function(reason) {
      if (done) return
      done = true
      onRejected(reason)
    })
  } catch (exception) {
    if (done) return
    done = true
    onRejected(exception)
  }
}

function MyPromise(fn) {
  // state can be either PENDING, FULFILLED or REJECTED
  let state = PENDING
  // result or error once FULFILLED or REJECTED
  let value = null
  // store handlers that are attached by .then or .done
  let handlers = []

  function fulfill(result) {
    state = FULFILLED
    value = result
    handlers.forEach(handle)
    handlers = null
  }

  function reject(error) {
    state = REJECTED
    value = error
    handlers.forEach(handle)
    handlers = null
  }

  function resolve(result) {
    try {
      const then = getThen(result)
      if (then) {
        doResolve(then.bind(result), resolve, reject)
        return
      }
      fulfill(result)
    } catch (e) {
      reject(e)
    }
  }

  function handle(handler) {
    if (state === PENDING) {
      handlers.push(handler)
    } else {
      if (
        state === FULFILLED && 
        typeof handler.onFulfilled === 'function'
      ) {
        handler.onFulfilled(value)
      }
      if (
        state === REJECTED && 
        typeof handler.onRejected === 'function'
      ) {
        handler.onRejected(value)
      }
    }
  }

  this.then = function(onFulfilled, onRejected) {
    const self = this
    return new MyPromise(function(resolve, rejecte) {
      return self.done(function(result) {
        if (typeof onFulfilled === 'function') {
          try {
            return resolve(onFulfilled(result))
          } catch(exception) {
            reject(exception)
          }
        } else {
          return resolve(result)
        }
      }, function(error) {
        if (typeof onRejected === 'function') {
          try {
            return reject(onRejected(error))
          } catch(exception) {
            return reject(exception)
          }
        } else {
          return reject(error)
        }
      })
    })
  }

  this.done = function (onFulfilled, onRejected) {
    setTimeout(function() {
      handle({
        onFulfilled: onFulfilled,
        onRejected: onRejected
      })
    }, 0)
  }

  doResolve(fn, resolve, reject)
}

module.exports = MyPromise
