/* Resource/Mapper configs for testing

  These are mock 'resources' to use with JS-data mapper definition setup.
  The policies referenced by string on in ./Policies.js
*/

module.exports = {

  user: {
    policies: 'userPolicy'
  },

  misc: {
    // should use this key as the name of the resource
    name: 'myResource'
  },

  records: {
    policies: {
      find: 'recordsFind',
      create: ['recordsCreate', 'isLoggedIn'],
      destroy: (req, res, next) => {
        res.status(401).send()
      }
    }
  }
}
