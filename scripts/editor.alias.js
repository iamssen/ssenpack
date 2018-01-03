const Webpack = require('./base/webpack');

module.exports = (options) => () => {
  const webpack = new Webpack(options);
  return webpack.alias;
};