const nodemon = require('nodemon');
const path = require('path');
const getModulePath = require('./base/getModulePath');

module.exports = (options) => () => {
  nodemon({
    watch: [
      path.join(options.CWD, 'dist-dev', 'server/'),
    ],
    exec: `node -r ${getModulePath(options, 'source-map-support', '/register')} ${path.join(options.CWD, 'dist-dev', 'server')}`,
  });
};