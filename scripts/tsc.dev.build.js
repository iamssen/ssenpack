const { createWebpack } = require('./tsc.build');

const build = webpack => new Promise((resolve, reject) => {
  webpack.run((err, stats) => {
    if (err) {
      console.error(err);
      reject(err);
    } else {
      console.log(stats.toString({
        chunks: true,
        colors: true,
      }));
      resolve();
    }
  })
});

module.exports = (options) => (target) => {
  const buildOption = options.tsc.entry[target];

  if (buildOption) {
    build(createWebpack({ options, ...buildOption, mode: 'development' }))
      .then(() => console.log('😃 tsc build is successful.'))
      .catch(err => console.error('😫 tsc build is failed.', err));
  } else {
    console.error(`🤔 "${target}" entry is undefined`);
  }
}