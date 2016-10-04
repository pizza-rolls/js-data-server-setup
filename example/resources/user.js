export defualt {
  name: 'user',
  mapperConfig: {}, // config passed to Container.defineMapper(name, mapperConfig)
  events: {
    // will assign any events to mapper listeners
    afterCreate: (props, opts, result) => {
      // don something
    }
  }
}
