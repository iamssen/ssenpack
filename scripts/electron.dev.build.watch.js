const {Builder} = require('./electron.dev.build');

module.exports = (options) => () => {
  const builder = new Builder(options);
  builder.watch();
};