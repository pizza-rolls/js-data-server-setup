[![npm version](https://badge.fury.io/js/js-data-server-setup.svg)](https://badge.fury.io/js/js-data-server-setup)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

[![Build Status](https://travis-ci.org/pizza-rolls/js-data-server-setup.svg?branch=master)](https://travis-ci.org/pizza-rolls/js-data-server-setup)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Code Climate](https://codeclimate.com/github/pizza-rolls/js-data-server-setup/badges/gpa.svg)](https://codeclimate.com/github/pizza-rolls/js-data-server-setup)

[![forthebadge](https://img.shields.io/badge/Node.js-v4-yellow.svg)](http://nodejs.org)
[![forthebadge](https://img.shields.io/badge/Node.js-v6-orange.svg)](http://nodejs.org)

[![forthebadge](https://img.shields.io/badge/Mom%20Made-Pizza%20Rolls-blue.svg)](http://pizza.com)


# js-data-server-setup


## Usage

`npm install js-data-server-setup`

```js
import jsDataServerSetup from 'js-data-server-setup'

const jsDataServer = new jsDataServerSetup({
  expressApp,
  container, // must be an instance of Container on the server
  adapter
})

// setup and individual resource
jsDataServer.setupResource({
  policies, // middleware/policy that is added to endpoint (see examples below)
  mapperConfig
})

// after you're all done setting up resources, you need to call mount()
jsDataServer.mount()


// -- or --

// setup all resources (mount() is invoked automatically, see api docs for details)
jsDataServer.setup(resources)
```
