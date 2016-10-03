import { MongoDBAdapter } from 'js-data-mongodb'
import { Container } from 'js-data'
import express from 'express'
import JsDataServerSetup from '../src/index.js'
import assert from 'assert'
import request from 'supertest'

import Resources from './Resources.js'
import Policies from './Policies.js'

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
const app = express()

const container = new Container({
  mapperDefaults: {
    idAttribute: '_id'
  }
})

let createdRecordID
let server
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

describe('Setup.test.js - Setup, Instantiation, & Invokation', function () {
  it('should be a class instantiation', function () {
    assert.strictEqual(typeof JsDataServerSetup, 'function')
  })

  it('should throw if no adapter is passed in', function () {
    assert.throws(() => {
      const x = new JsDataServerSetup()
      assert.ok(x)
    },
      Error
    )
  })

  it('should insantiate a class', function () {
    server = new JsDataServerSetup({
      app: app,
      container: container,
      adapter: new MongoDBAdapter(),
      policies: Policies,
      adapters: {}
    })
    assert.ok(server)
  })

  it('should use an express instance passed in on instantiation', function () {
    assert.ok(server.app === app)
  })

  it('should accept a hashmap of resourcees for setup', function () {
    server.setup(
      Resources, // ./Resources.js
      false // this tells the module not to mount after setup()
    )
    assert.equal(typeof server.resources.user, 'object')
    assert.equal(typeof server.resources.myResource, 'object')
    assert.equal(typeof server.resources.records, 'object')
  })

  it('should accept an array of resource objects for setup', function () {
    server.setup([{ name: 'resourceOne' }], false)

    assert.equal(typeof server.resources.resourceOne, 'object')
  })

  it('should not have mounted to the express app when passing `false` to .setup()', function () {
    assert.equal(server._isMounted, false)
  })

  it('should setup an individual resource', function () {
    server.setupResource({
      name: 'messages'
    })
    assert.equal(typeof server.resources.messages, 'object')
  })

  it('should allow the express app to mount ok', function () {
    server.mount()
    assert.equal(server._isMounted, true)
  })

  it('should allow the express app to listen on port 3031', function () {
    assert.ok(app.listen(3031))
  })
})

describe('Setup.test.js - Check Endpoints & Policies', function () {
  it('should have a /user endpoint & hit "userPolicy"', function (done) {
    request(app)
      .get('/user')
      .expect(200)
      .expect('userPolicy', 'true')
      .end(function (err, res) {
        if (err) throw err

        done()
      })
  })

  it('should have a /myResource endpoint that used "name" key in config in place of hashmap property key', function (done) {
    request(app)
      .get('/myResource')
      .expect(200)
      .end(function (err, res) {
        if (err) throw err

        done()
      })
  })

  it('should have a /user endpoint & hit "userPolicy"', function (done) {
    request(app)
      .get('/user')
      .expect(200)
      .expect('userPolicy', 'true')
      .end(function (err, res) {
        if (err) throw err

        done()
      })
  })

  it('should use a "find" policy for GET /records', function (done) {
    request(app)
      .get('/records')
      .expect(200)
      .expect('recordsFind', 'true')
      .end(function (err, res) {
        if (err) throw err

        done()
      })
  })

  it('should use a "create" policy for POST /records', function (done) {
    request(app)
      .post('/records')
      .field('name', 'cory')
      .expect(200)
      .expect('recordsCreate', 'true')
      .expect('isLoggedIn', 'true')
      .end(function (err, res) {
        if (err) throw err

        createdRecordID = res.body._id
        done()
      })
  })

  it('should use a "destroy" policy for DELETE /records', function (done) {
    request(app)
      .delete('/records/' + createdRecordID)
      .expect(401)
      .end(function (err, res) {
        if (err) throw err

        done()
      })
  })
})
