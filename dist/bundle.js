'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var jsDataExpress = require('js-data-express');
var jsData = require('js-data');
var express = _interopDefault(require('express'));

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var JsDataServerSetup = function () {
  function JsDataServerSetup() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    classCallCheck(this, JsDataServerSetup);

    // base route to mount js-data-express
    this.baseRoute = config.baseRoute || '/';
    // express app instance to use
    this.app = config.app || express();
    // js-data container to use
    this.container = config.container || new jsData.Container();
    this.adapter = config.adapter; // default adapter to use
    // a hashmap of resource mappers
    this.resources = {};
    // flag if router has been mounted to this.app
    this._isMounted = false;

    // policies hashmap for use with references in setting up resources
    this.policies = config.policies;
    // adapters hashmap for use with references in setting up resources
    this.adapters = config.adapters;

    // register default adapter on container
    if (!this.adapter) {
      throw new Error('JsDataServerSetup adapter is required');
    }
    this.registerAdapter(this.container, { adapter: this.adapter, name: 'containerDefaultAdapter' });

    // instantiate a router to use (later added to this.app in this.mount())
    this.apiRoutes = express.Router();
    // use js-data-express's queryParser
    this.apiRoutes.use(jsDataExpress.queryParser);

    return this;
  }

  /**
   * Mount the router to the app via js-data-express after all resources have been setup.
   */


  createClass(JsDataServerSetup, [{
    key: 'mount',
    value: function mount() {
      if (this._isMounted) {
        console.log('JsDataServerSetup.mount() is being called again. You can only\n      mount once. Please check your code and rearrange the order you setup your\n      resources.');
        throw new Error();
      }

      try {
        this.app.use(this.baseRoute, this.apiRoutes);
        this._isMounted = true;
      } catch (e) {
        console.log('JsDataServerSetup.mount() error mounting to app. Check that the\n      config param \'app\' is an instance of Express.');
        console.log(e);
      }
    }

    /**
     * Helper method for an array or hashmap of resources. This will invoke mount()
     * after all resources are iterated unless the false is passed as the 2nd arg
     * @name setup
     * @param {array|object} resources - An array of resource objects or a hashmap of { resourceName => resourceConfig }
     */

  }, {
    key: 'setup',
    value: function setup(resources) {
      var _this = this;

      var mount = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      if (Array.isArray(resources)) {
        resources.forEach(this.setupResource, this);
      } else if ((typeof resources === 'undefined' ? 'undefined' : _typeof(resources)) === 'object') {
        Object.keys(resources).forEach(function (resourceName) {
          // ensure the resource has a name if we're processing a hashmap
          !resources[resourceName].name ? resources[resourceName].name = resourceName : null;
          _this.setupResource(resources[resourceName]);
        }, this);
      } else {
        throw new Error('JsDataServerSetup.setup() requires an array or an hashmap of resources');
      }

      if (mount) {
        this.mount();
      }
    }

    /**
     * Setup a mapper resource on this.container
     * @param {object} options - The resource options for setup
     * @param {string} [options.name=mapperConfig.name] - Name of the resource
     * @param {object} [options.endpointConfig] - Config obj: http://api.js-data.io/js-data-express/1.0.0-rc.1/global.html#Config
     * @param {object} [options.mapperConfig] - The config to be used on .defineMapper()
     * @param {object} [options.adapter] - An adapter to use on this resource
     * @param {string} [options.adapter.name] - The name of the adapter key in this.adapters
     * @param {string|array|function|object} [options.policies] - A policy list of policies or middleware function. Can be a name referencing this.policies or a middleware method ie: (req, res, next) => {}
     *                                                          If it is an object, it must use this signature for action specific policies: { find, update, destroy, create }
     */

  }, {
    key: 'setupResource',
    value: function setupResource(_ref) {
      var _this2 = this;

      var name = _ref.name;
      var endpointConfig = _ref.endpointConfig;
      var mapperConfig = _ref.mapperConfig;
      var adapter = _ref.adapter;
      var policies = _ref.policies;

      if (!name && !mapperConfig && !mapperConfig.name) throw new Error('JsDataServerSetup.setupResource() requires a resource name');

      name || (name = mapperConfig.name);
      endpointConfig || (endpointConfig = {});
      mapperConfig || (mapperConfig = {});

      // the route path to use on the express router
      var routePath = '/' + name;

      this.resources[name] = this.container.defineMapper(Object.assign({ name: name }, mapperConfig));

      if (adapter) {
        if (typeof adapter !== 'string') {
          console.log('JsDataServerSetup.setupResource() error using resource ' + name + ' adapter.\n        The adpater property must be a string that references the name/key of an adapter in\n        the adapters hashmap.');
          throw new Error();
        }
        this.resources[name].registerAdapter(this.resources[name], adapter);
      }

      // middleware to mount on route ie: policies
      var middleware = [];

      if (policies) {
        try {
          if ((typeof policies === 'undefined' ? 'undefined' : _typeof(policies)) === 'object' && !Array.isArray(policies)) {
            (function () {
              // iterate each key/action as an array|string|method of policies and mount
              // to route HTTP verb before moving on
              var _allowedActionKeys = ['find', 'create', 'update', 'destroy'];
              Object.keys(policies).forEach(function (action) {
                action = action.toLowerCase();
                if (!_allowedActionKeys.includes(action)) {
                  console.log('JsDataServerSetup.setupResource() policies key/action ' + action + ' not recognized.\n              You can only use \'create\', \'find\', \'update\', & \'destroy keys for policies actions.\'');
                  throw new Error();
                }

                var actionMiddleware = [];
                addMiddleware(policies[action], actionMiddleware, _this2);

                // the router method to be used for mounting this action
                var method = void 0;

                switch (action) {
                  case 'create':
                    method = 'post';
                    break;
                  case 'find':
                    method = 'get';
                    break;
                  case 'update':
                    method = 'put';
                    break;
                  case 'destroy':
                    method = 'delete';
                    break;
                }

                // only mount if actionMiddleware is not an empty array
                if (actionMiddleware.length > 0) {
                  _this2.apiRoutes[method](routePath, actionMiddleware);
                }
              }, _this2); // end > Object.keys().forEach()
            })();
          } else {
            addMiddleware(policies, middleware, this);
          }
        } catch (e) {
          console.log('JsDataServerSetup.setupResource() policies for resource ' + name + '\n        must be a string, middleware function, or array of either of those -or-\n        an object matching the create/find/update/destroy signature allowed.');
          throw new Error(e);
        }
      }
      // mount any middleware
      // only mount if middleware is not an empty array
      if (middleware.length > 0) {
        this.apiRoutes.use(routePath, middleware);
      }

      // mount this resource
      this.apiRoutes.use(routePath, new jsDataExpress.Router(this.resources[name], endpointConfig).router);
    }

    // returns the policy method from this.policies - throws if none exists

  }, {
    key: 'getPolicy',
    value: function getPolicy(name) {
      if (!this.policies || !this.policies[name]) {
        console.log('JsDataServerSetup.getPolicy() policies do not exist or cannot find policy ' + name);
        throw new Error();
      } else if (typeof this.policies[name] !== 'function') {
        console.log('JsDataServerSetup.getPolicy() policy ' + name + ' is not a middleware method ie: (req, res, next) => { ... }');
        throw new Error();
      }
      return this.policies[name];
    }
  }, {
    key: 'registerAdapter',
    value: function registerAdapter(component, adapter) {
      var adapterName = adapter.name || 'noNameAdapter';
      adapter = adapter.adapter || adapter;

      try {
        component.registerAdapter(adapterName, adapter, { default: true });
      } catch (e) {
        console.log('JsDataServerSetup.registerAdapter() unable to registerAdapter ' + adapterName);
        throw new Error(e);
      }
    }
  }]);
  return JsDataServerSetup;
}();

function addMiddleware(policies, middlewareList, context) {
  if (Array.isArray(policies)) {
    policies.forEach(function (p) {
      addMiddleware(p, middlewareList, context);
    }, context);
  } else if (typeof policies === 'string') {
    middlewareList.push(context.getPolicy(policies));
  } else if (typeof policies === 'function') {
    middlewareList.push(policies);
  } else {
    throw new Error();
  }
}

module.exports = JsDataServerSetup;