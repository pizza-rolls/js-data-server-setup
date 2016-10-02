import { Router, queryParser } from 'js-data-express'
import { Container } from 'js-data'
import express from 'express'

export default class JsDataServerSetup {
  constructor (config = {}) {
    // base route to mount js-data-express
    this.baseRoute = config.baseRoute || '/'
    // express app instance to use
    this.app = config.app || express()
    // js-data container to use
    this.container = config.container || new Container()
    this.adapter = config.adapter // default adapter to use
    // a hashmap of resource mappers
    this.resources = {}
    // flag if router has been mounted to this.app
    this._isMounted = false

    // policies hashmap for use with references in setting up resources
    this.policies = config.policies
    // adapters hashmap for use with references in setting up resources
    this.adapters = config.adapters

    // register default adapter on container
    this.registerAdapter(this.container, {adapter: this.adapter, name: 'containerDefaultAdapter'})

    // instantiate a router to use (later added to this.app in this.mount())
    this.apiRoutes = express.Router()
    // use js-data-express's queryParser
    this.apiRoutes.use(queryParser)

    return this
  }

  /**
   * Mount the router to the app via js-data-express after all resources have been setup.
   */
  mount () {
    if (this._isMounted) {
      console.log(`JsDataServerSetup.mount() is being called again. You can only
      mount once. Please check your code and rearrange the order you setup your
      resources.`)
      throw new Error()
    }

    try {
      this.app.use(this.baseRoute, this.apiRoutes)
      this._isMounted = true
    } catch (e) {
      console.log(`JsDataServerSetup.mount() error mounting to app. Check that the
      config param 'app' is an instance of Express.`)
      console.log(e)
    }
  }

  /**
   * Helper method for an array or hashmap of resources. This will invoke mount()
   * after all resources are iterated unless the false is passed as the 2nd arg
   * @name setup
   * @param {array|object} resources - An array of resource objects or a hashmap of { resourceName => resourceConfig }
   */
  setup (resources, mount = true) {
    if (Array.isArray(resources)) {
      resources.forEach(this.setupResource, this)
    } else if (typeof resources === 'object') {
      Object.keys(resources).forEach(resourceName => {
        // ensure the resource has a name if we're processing a hashmap
        (!resources[resourceName].name) ? resources[resourceName].name = resourceName : (null)
        this.setupResource(resources[resourceName])
      }, this)
    } else {
      throw new Error('JsDataServerSetup.setup() requires an array or an hashmap of resources')
    }

    if (mount) {
      this.mount()
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
  setupResource ({ name, endpointConfig, mapperConfig, adapter, policies }) {
    if (!name && !mapperConfig && !mapperConfig.name) throw new Error('JsDataServerSetup.setupResource() requires a resource name')

    name || (name = mapperConfig.name)
    endpointConfig || (endpointConfig = {})
    mapperConfig || (mapperConfig = {})

    // the route path to use on the express router
    const routePath = `/${name}`

    this.resources[name] = this.container.defineMapper(Object.assign({name: name}, mapperConfig))

    if (adapter) {
      if (typeof adapter !== 'string') {
        console.log(`JsDataServerSetup.setupResource() error using resource ${name} adapter.
        The adpater property must be a string that references the name/key of an adapter in
        the adapters hashmap.`)
        throw new Error()
      }
      this.resources[name].registerAdapter(this.resources[name], adapter)
    }

    // middleware to mount on route ie: policies
    let middleware = []

    if (policies) {
      try {
        if (typeof policies === 'object' && !Array.isArray(policies)) {
          // iterate each key/action as an array|string|method of policies and mount
          // to route HTTP verb before moving on
          const _allowedActionKeys = ['find', 'create', 'update', 'destroy']
          Object.keys(policies).forEach(action => {
            action = action.toLowerCase()
            if (!_allowedActionKeys.includes(action)) {
              console.log(`JsDataServerSetup.setupResource() policies key/action ${action} not recognized.
              You can only use 'create', 'find', 'update', & 'destroy keys for policies actions.'`)
              throw new Error()
            }

            const actionMiddleware = []
            addMiddleware(policies[action], actionMiddleware, this)

            // the router method to be used for mounting this action
            let method

            switch (action) {
              case 'create':
                method = 'post'
                break
              case 'find':
                method = 'get'
                break
              case 'update':
                method = 'put'
                break
              case 'destroy':
                method = 'delete'
                break
            }

            // only mount if actionMiddleware is not an empty array
            if (actionMiddleware.length > 0) {
              this.apiRoutes[method](routePath, actionMiddleware)
            }
          }, this) // end > Object.keys().forEach()
        } else {
          addMiddleware(policies, middleware, this)
        }
      } catch (e) {
        console.log(`JsDataServerSetup.setupResource() policies for resource ${name}
        must be a string, middleware function, or array of either of those -or-
        an object matching the create/find/update/destroy signature allowed.`)
        throw new Error(e)
      }
    }
    // mount any middleware
    // only mount if middleware is not an empty array
    if (middleware.length > 0) {
      this.apiRoutes.use(routePath, middleware)
    }

    // mount this resource
    this.apiRoutes.use(
      routePath,
      new Router(this.resources[name], endpointConfig).router
    )
  }

  // returns the policy method from this.policies - throws if none exists
  getPolicy (name) {
    if (!this.policies || !this.policies[name]) {
      console.log(`JsDataServerSetup.getPolicy() policies do not exist or cannot find policy ${name}`)
      throw new Error()
    } else if (typeof this.policies[name] !== 'function') {
      console.log(`JsDataServerSetup.getPolicy() policy ${name} is not a middleware method ie: (req, res, next) => { ... }`)
      throw new Error()
    }
    return this.policies[name]
  }

  registerAdapter (component, adapter) {
    let adapterName = adapter.name || `noNameAdapter`
    adapter = adapter.adapter || adapter

    try {
      component.registerAdapter(adapterName, adapter, {default: true})
    } catch (e) {
      console.log(`JsDataServerSetup.registerAdapter() unable to registerAdapter ${adapterName}`)
      throw new Error(e)
    }
  }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>> Private Functions >>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// private helper method for recursion
function addMiddleware (policies, middlewareList, context) {
  if (Array.isArray(policies)) {
    policies.forEach(p => {
      addMiddleware(p, middlewareList, context)
    }, context)
  } else if (typeof policies === 'string') {
    middlewareList.push(context.getPolicy(policies))
  } else if (typeof policies === 'function') {
    middlewareList.push(policies)
  } else {
    throw new Error()
  }
}
