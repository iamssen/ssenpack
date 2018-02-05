module.exports = (options, config) => {
  return typeof options.webpackConfig === 'function'
    ? options.webpackConfig(options, config)
    : config;
};