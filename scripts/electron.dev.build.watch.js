const {Builder} = require('./electron.dev.build');
const rimraf = require('rimraf');
const path = require('path');

module.exports = (options) => () => {
  rimraf(path.join(options.CWD, 'dist-dev', 'electron'), err => {
    if (err) throw err;
    
    const builder = new Builder(options);
    builder.watch();
  });
};