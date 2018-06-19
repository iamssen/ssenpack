// @formatter:off
module.exports = (options) => {
  options = {
    ...options,
    CWD: process.cwd(),
    MODULE_HOME: __dirname,
  };
  
  const instances = {
    web: {
      build: require('./scripts/web.build')({...options, command: 'web.build'}),
      dev: {
        build: require('./scripts/web.dev.build')({...options, command: 'web.dev.build'}),
        start: require('./scripts/web.dev.start')({...options, command: 'web.dev.start'}),
      },
      server: {
        build: require('./scripts/web.server.build')({...options, command: 'web.server.build'}),
        dev: {
          build: require('./scripts/web.server.dev.build')({...options, command: 'web.server.dev.build'}),
          start: require('./scripts/web.server.dev.start')({...options, command: 'web.server.dev.start'}),
        },
      },
    },
    electron: {
      dev: {
        build: require('./scripts/electron.dev.build')({...options, command: 'electron.dev.build'}),
      },
    },
    libs: {
      build: require('./scripts/libs.build')({...options, command: 'libs.build'}),
      publish: require('./scripts/libs.publish')({...options, command: 'libs.publish'}),
    },
    messages: {
      build: require('./scripts/messages.build')({...options, command: 'messages.build'}),
    },
    editor: {
      alias: require('./scripts/editor.alias')({...options, command: 'editor.alias'}),
    },
  };
  
  instances.web.dev.build.watch = require('./scripts/web.dev.build.watch')({...options, command: 'web.dev.build.watch'});
  instances.web.server.dev.build.watch = require('./scripts/web.server.dev.build.watch')({...options, command: 'web.server.dev.build.watch'});
  instances.electron.dev.build.watch = require('./scripts/electron.dev.build.watch')({...options, command: 'electron.dev.build.watch'});
  
  return instances;
};