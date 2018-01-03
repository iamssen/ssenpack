const nodemon = require('nodemon');
const path = require('path');
const fs = require('fs');

module.exports = (options) => () => {
  const sourceMapSupportRegister = fs.existsSync(`${options.CWD}/node_modules/source-map-support`)
    ? `${options.CWD}/node_modules/source-map-support/register`
    : `${options.MODULE_HOME}/node_modules/source-map-support/register`;
  
  nodemon({
    watch: [
      path.join(options.CWD, 'dist-dev', 'server/'),
    ],
    exec: 'node -r ' + sourceMapSupportRegister + ' ' + path.join(options.CWD, 'dist-dev', 'server'),
  });
};