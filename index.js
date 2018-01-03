module.exports = (options) => {
  options = Object.assign({
    CWD: process.cwd(),
    MODULE_HOME: __dirname,
  }, options);
  
  const instances = {
    web: {
      build: require('./scripts/web.build')(options),
      dev: {
        build: require('./scripts/web.dev.build')(options),
        start: require('./scripts/web.dev.start')(options),
      },
      server: {
        build: require('./scripts/web.server.build')(options),
        dev: {
          build: require('./scripts/web.server.dev.build')(options),
          start: require('./scripts/web.server.dev.start')(options),
        },
      },
      dll: {
        build: require('./scripts/web.dll.build')(options),
      },
    },
    electron: {
      dev: {
        build: require('./scripts/electron.dev.build')(options),
      },
    },
    libs: {
      build: require('./scripts/libs.build')(options),
      publish: require('./scripts/libs.publish')(options),
    },
    messages: {
      build: require('./scripts/messages.build')(options),
    },
    editor: {
      alias: require('./scripts/editor.alias')(options),
    },
  };
  
  instances.web.server.dev.build.watch = require('./scripts/web.server.dev.build.watch')(options);
  instances.electron.dev.build.watch = require('./scripts/electron.dev.build.watch')(options);
  
  return instances;
};