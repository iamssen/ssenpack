const {Builder} = require('./web.dev.build');
const path = require('path');
const rimraf = require('rimraf');

module.exports = (options) => () => {
  rimraf(path.join(options.CWD, 'dist-dev', 'web'), err => {
    if (err) throw err;
    
    const builder = new Builder(options);
    builder.watch();
  });
};