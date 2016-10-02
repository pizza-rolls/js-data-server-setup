import express from 'express'
import { Router, queryParser } from 'js-data-express'
import { Container } from 'js-data'

class JsDataServerSetup {
  constructor (config = {}) {
    this.baseRoute = config.baseRoute || '/'
    this.app = config.app || express()
    this.container = config.container || new Container()
    this.adapter = config.adapter
    // a hashmap of resource mappers
    this.resources = {}
    // flag if router has been mounted to this.app
    this._isMounted = false
    if (!this.adapter) throw new Error('JsDataServerSetup requires an a Js-Data Adapter')
    this.container.registerAdapter('defaultAdapter', this.adapter, {default: true})

    this.apiRoutes = express.Router()
    // use js-data-express's queryParser
    this.apiRoutes.use(queryParser)

    return this
  }

  /**
   * Mount the router to the app after all resources have been setup.
   */
  mount () {
    this.app.use(this.baseRoute || '/', this.apiRoutes)
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
   * @param {object} [options.adapter.name] - The name of the adapter
   */
  setupResource ({ name, endpointConfig, mapperConfig, adapter }) {
    if (!name && !mapperConfig && !mapperConfig.name) throw new Error('JsDataServerSetup.setupResource() requires a resource name')
    mapperConfig || (mapperConfig = {})
    name || (name = mapperConfig.name)
    this.resources[name] = this.container.defineMapper(
      Object.assign({name: name}, mapperConfig)
    )

    if (adapter) this.resources[name].registerAdapter(this.resources[name], adapter)

    // mount this resource
    this.apiRoutes.use(
      `/${name}`,
      new Router(this.resources[name], endpointConfig).router
    )
  }

  registerAdapter (component, adapter) {
    let adapterName = adapter.name || `noNameAdapter`
    try {
      component.registerAdapter(adapterName, adapter, {default: true})
    } catch (e) {
      console.log(`JsDataServerSetup.setupResource() unable to registerAdapter ${adapterName} on resource`)
      throw new Error(e)
    }
  }
}

export default JsDataServerSetup
