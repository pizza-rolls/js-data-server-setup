// Policies hashmap for testing with ./Resources.js
module.exports = {
  userPolicy: (req, res, next) => {
    res.set({
      'userPolicy': true
    })
    next()
  },
  isLoggedIn: (req, res, next) => {
    res.set({
      'isLoggedIn': true
    })
    next()
  },
  recordsFind: (req, res, next) => {
    res.set({
      'recordsFind': true
    })
    next()
  },
  recordsCreate: (req, res, next) => {
    res.set({
      'recordsCreate': true
    })
    next()
  },
  recordsUpdate: (req, res, next) => {
    res.set({
      'recordsUpdate': true
    })
    next()
  }
}
