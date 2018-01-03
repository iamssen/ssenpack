const {Builder} = require('./web.server.dev.build');

module.exports = (options) => () => {
  const builder = new Builder(options);
  builder.watch();
};