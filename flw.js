'use strict';

(function() {
  var root = this;

  // Globals
  var callFn = _callSetTimeout;
  var fnMap = {};

  var ourContextKeys = [
    // methods
    '_store',
    '_stop',
    '_stopped',
    '_clean',

    // deprecated
    '_flw_store'
  ];

  // in NodeJS ?
  if (typeof require === 'function') {
    callFn = setImmediate;
  }

  /**
   * Call functions in order of the array
   * @param {function[]} fns Array of function to execute
   * @param {Object} [context] The initial context object (optional)
   * @param {function} done callback
   */
  fnMap.series = function series(fns, context, done) {
    if (done === undefined && typeof context === 'function') {
      done = context;
      context = {};
    }
    _checkContext(context);

    var numTodo = fns.length;
    if (numTodo <= 0) return callFn(done, null, context);

    var fnIterator = 0;
    return callFunction();

    function callFunction() {
      if (context._stopped) return onSeriesCallDone(null, null);

      callFn(fns[fnIterator], context, onSeriesCallDone);
    }

    function onSeriesCallDone(err) {
      if (err) return done(err, context);

      if (++fnIterator >= numTodo) return done(null, context);
      return callFunction();
    }
  };


  /**
   * Call functions in parallel
   * @param {function[]} fns Array of function to exectute
   * @param {Object} [context] The initial context object (optional)
   * @param {function} done callback
   */
  fnMap.parallel = function parallel(fns, context, done) {
    if (done === undefined && typeof context === 'function') {
      done = context;
      context = {};
    }
    _checkContext(context);

    var numTodo = fns.length;
    if (numTodo <= 0) return callFn(done, null, context);

    var numDone = 0;
    var doneCalled = false;

    fns.forEach(function (fn) {
      return callFn(fn, context, onParallelCallDone);
    });

    function onParallelCallDone(err) {
      if (err) return callDone(err);
      if (++numDone >= numTodo) return callDone(err);
    }
    function callDone(err) {
      // We cannot call done twice, a possible error would be lost here
      if (doneCalled) return;

      doneCalled = true;
      return done(err || null, context);
    }
  };

  /**
   * Returns wrapped regular function that stores the result on the context key
   * @param {function} fn function to wrap
   * @param {any[]} [args] Array of arguments to pass (optional)
   * @param {String} [key] name of context key to store the result in (optional)
   */
  function wrap(fn, args, key) {
    var self = this;

    if (key === undefined && typeof(args) === 'string') {
      key = args;
      args = [];
    }
    if (!args) args = [];

    return function wrapper(context, cb) {
      var copyArgs = args.slice(args);
      copyArgs.unshift(self);
      copyArgs.push(onWrappedDone);
      return fn.bind.apply(fn, copyArgs)();

      function onWrappedDone(err, result) {
        if (err) return cb(err);

        if (key) context[key] = result;
        return cb(null);
      }
    };
  }

  /**
   * Calls fn with every item in the array
   * @param {any[]} items Array items to process
   * @param {Number} [numParallel] Limit parallelisation (default: 3)
   * @param {function} fn function call for each item
   * @param {function} done callback
   */
  function each(items, numParralel, fn, done) {
    if (done === undefined) {
      done = fn; fn = numParralel;
      numParralel = 3;
    }

    if (numParralel <= 0) numParralel = 1;

    var doing = 0;
    var numProcessing = 0;
    var numDone = 0;
    var numTotal = items.length;
    var results = [];
    return nextItem();

    function nextItem() {
      // We done-check first in case of emtpty array
      if (numDone >= numTotal) return done(null, results);

      // Batch (or call next item)
      while (doing < numTotal && numProcessing < numParralel) {
        callFn(fn, items[doing++], onDone);
        numProcessing++;
      }
      return;

      // All done
      function onDone(err, result) {
        if (err) return done(err);

        results.push(result);
        numProcessing--;
        numDone++;
        return nextItem();
      }
    }
  }

  /**
   * Calls fn x times (with index)
   * @param {Number} [num] number of times to call fn
   * @param {function} fn function call for each item
   * @param {function} done callback
   */
  function n(num, fn, done) {
    var results = [];
    return nextItem();

    function nextItem() {
      if (results.length >= num) return done(null, results);

      callFn(fn, results.length, function (err, result) {
        if (err) return done(err);

        results.push(result);
        return nextItem();
      });
    }
  }

  /**
   * Calls fn x times
   * @param {Number} [num] number of times to call fn
   * @param {function} fn function call for each item
   * @param {function} done callback
   */
  function times(num, fn, done) {
    var results = [];
    return nextItem();

    function nextItem() {
      if (results.length >= num) return done(null, results);

      callFn(fn, function (err, result) {
        if (err) return done(err);

        results.push(result);
        return nextItem();
      });
    }
  }

  /**
   * build the list of exposed methods into the .make syntax
   */
  function make() {
    // create a map of all flow functions wrapped by _make
    var makeFnMap = {};
    Object.keys(fnMap).forEach(function(key) {
      makeFnMap[key] = _make(fnMap[key]);
    });
    return makeFnMap;

    // takes a function and wraps it so that execution is 'postponed'
    function _make(fn) {
      // the user calls this function, e.g. flw.make.series(...)
      return function madeFunction(fns) {
        // this function is consumed by flw
        return function flowFunction(context, done) {
          if (done === undefined && typeof context === 'function') {
            done = context;
            context = {};
          }
          _checkContext(context);

          if (typeof done !== 'function') {
            throw new Error('_make - done !== function');
          }
          return fn(fns, context, done);
        };
      };
    }
  }


  /**
   * Call functions with setTimeout (for browser support)
   * @private
   */
  function _callSetTimeout(fn, context, cb) {
    return setTimeout(fn, 0, context, cb);
  }


  /**
   * Ensures a enrichched flw context when a flow is starting
   * @private
   */
  function _checkContext (c) {
    if (c.hasOwnProperty('_stopped')) return; // Already done?

    c._stopped = null;

    // Indicate that we gracefully stop
    //  if set, stops the flow until we are back to the main callback
    function _flw_stop(reason, cb) {
      if (!cb && typeof reason === 'function') {
        cb = reason;
        reason = 'stopped';
      }
      c._stopped = reason;
      return cb();
    }
    Object.defineProperty(c, '_stop', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: _flw_stop,
    });

    // Stores the data returned from the callback in the context with key 'key'
    //  then calls the callback
    function _flw_store(key, cb) {
      var self = this;

      var fn = function (err, data) {
        if (err) return cb(err);

        self[key] = data;
        return cb();
      };
      return fn;
    }
    Object.defineProperty(c, '_store', {
      enumerable: false,
      configurable: false,
      value: _flw_store,
    });

    // Cleans all flw related properties from the context object
    function _flw_clean() {
      var self = this;
      var contextCopy = {};
      Object.keys(this).forEach(function (k) {
        if (ourContextKeys.indexOf(k) !== -1) return;
        contextCopy[k] = self[k];
      });
      return contextCopy;
    }
    Object.defineProperty(c, '_clean', {
      enumerable: false,
      configurable: false,
      value: _flw_clean,
    });

    // compatibilty for a while
    Object.defineProperty(c, '_flw_store', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: _flw_store,
    });

    return c;
  }

  /**
   * Export
   */
  var flw = {};
  Object.keys(fnMap).forEach(function(key) {
    flw[key] = fnMap[key];
  });
  flw.make = make();
  flw.wrap = wrap;
  flw.each = each;
  flw.n = n;
  flw.times = times;

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = flw;
    }
    exports.flw = flw;
  }
  else {
    root.flw = flw;
  }
}).call(this);
