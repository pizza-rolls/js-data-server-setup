import { MongoDBAdapter } from 'js-data-mongodb'
import { Container } from 'js-data'
import JsDataServerSetup from '../src/index.js'
import assert from 'assert'
// import request from 'supertest'
import sinon from 'sinon'

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
const container = new Container({
  mapperDefaults: {
    idAttribute: '_id'
  }
})
const server = new JsDataServerSetup({
  adapter: new MongoDBAdapter()
})

const afterCreateListener = sinon.spy((props) => {})
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

describe('Events.test.js', function () {
  it('should throw if resource events key is not an object', function () {
    assert.throws(() => {
      server.setupResource({ name: 'user', events: 'some string' })
    },
      Error
    )
  })

  it('should setup events w/ "afterCreate" listener', function () {
    server.setupResource({
      name: 'mail',
      events: {
        afterCreate: afterCreateListener
      }
    })
    // console.log(server.resources.user._listeners)
    assert.equal(typeof server.resources.mail, 'object')
    assert.equal(server.resources.mail._listeners.afterCreate.length, 1) // only one listener
    assert.equal(server.resources.mail._listeners.afterCreate[0].f, afterCreateListener)
  })
})
