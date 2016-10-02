import express from 'express'
import { Container } from 'js-data'
import JsDataServerSetup from 'js-data-server-setup'

// adapters
import mongoAdapter from './adapters/mongo'
import redisAdapter from './adapters/redis'

// resources
import user from './resources/user'
import session from './resources/session'

const jsDataServer = new JsDataServerSetup({
  baseRoute: '/', // optional - default
  app: express(), // optional - defaults to a new
  container: new Container(), // must be an instance of Container on the server
  adapter: mongoAdapter,
  policies: {} // policy hashmap for use by resources
})

// setup user resource (will use container's adapter)
jsDataServer.setupResource({
  policies: user.policies, // optional
  mapperConfig: user.mapperConfig // required minimum: { name: 'user' }
})

// setup session resource (will use redis adapter)
jsDataServer.setupResource({
  policies: session.policies,
  name: 'session', // required [or mapperConfig]
  adapter: redisAdapter // optional - will default to container's adapter
})
