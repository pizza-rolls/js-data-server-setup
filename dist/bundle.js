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

    this.baseRoute = config.baseRoute || '/';
    this.app = config.app || express();
    this.container = config.container || new jsData.Container();
    this.adapter = config.adapter;
    // a hashmap of resource mappers
    this.resources = {};
    // flag if router has been mounted to this.app
    this._isMounted = false;
    if (!this.adapter) throw new Error('JsDataServerSetup requires an a Js-Data Adapter');
    this.container.registerAdapter('defaultAdapter', this.adapter, { default: true });

    this.apiRoutes = express.Router();
    // use js-data-express's queryParser
    this.apiRoutes.use(jsDataExpress.queryParser);

    return this;
  }

  /**
   * Mount the router to the app after all resources have been setup.
   */


  createClass(JsDataServerSetup, [{
    key: 'mount',
    value: function mount() {
      this.app.use(this.baseRoute || '/', this.apiRoutes);
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
     * @param {object} [options.adapter.name] - The name of the adapter
     */

  }, {
    key: 'setupResource',
    value: function setupResource(_ref) {
      var name = _ref.name;
      var endpointConfig = _ref.endpointConfig;
      var mapperConfig = _ref.mapperConfig;
      var adapter = _ref.adapter;

      if (!name && !mapperConfig && !mapperConfig.name) throw new Error('JsDataServerSetup.setupResource() requires a resource name');
      mapperConfig || (mapperConfig = {});
      name || (name = mapperConfig.name);
      this.resources[name] = this.container.defineMapper(Object.assign({ name: name }, mapperConfig));

      if (adapter) this.resources[name].registerAdapter(this.resources[name], adapter);

      // mount this resource
      this.apiRoutes.use('/' + name, new jsDataExpress.Router(this.resources[name], endpointConfig).router);
    }
  }, {
    key: 'registerAdapter',
    value: function registerAdapter(component, adapter) {
      var adapterName = adapter.name || 'noNameAdapter';
      try {
        component.registerAdapter(adapterName, adapter, { default: true });
      } catch (e) {
        console.log('JsDataServerSetup.setupResource() unable to registerAdapter ' + adapterName + ' on resource');
        throw new Error(e);
      }
    }
  }]);
  return JsDataServerSetup;
}();

module.exports = JsDataServerSetup;