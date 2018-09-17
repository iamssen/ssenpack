const { createWebpack } = require('./tsc.build');

module.exports = (options) => (target) => {
  const buildOption = options.tsc.entry[target];

  if (buildOption) {
    createWebpack({ options, ...buildOption, mode: 'development' }).watch({}, (err, stats) => {
      if (err) {
        console.error(err);
      } else {
        console.log(stats.toString({
          chunks: true,
          colors: true,
        }));
      }
    });
  } else {
    console.error(`🤔 "${target}" entry is undefined`);
  }
}