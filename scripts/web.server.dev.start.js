const nodemon = require('nodemon');
const path = require('path');

module.exports = (options) => () => {
  nodemon({
    watch: [
      path.join(options.CWD, 'dist-dev', 'server/'),
    ],
    exec: 'node ' + path.join(options.CWD, 'dist-dev', 'server'),
  });
};