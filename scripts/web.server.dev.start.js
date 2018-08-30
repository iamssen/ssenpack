const nodemon = require('nodemon');
const path = require('path');
const getModulePath = require('./base/getModulePath');
const isWSL = require('./base/isWSL');

module.exports = (options) => () => {
  nodemon({
    watch: [
      path.join(options.CWD, 'dist-dev', 'server/'),
    ],
    legacyWatch: isWSL(),
    exec: `node -r ${getModulePath(options, 'source-map-support', '/register')} ${path.join(options.CWD, 'dist-dev', 'server')}`,
  });
};