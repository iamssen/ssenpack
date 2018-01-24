const Webpack = require('./base/webpack');
const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
const rimraf = require('rimraf');

class Builder extends Webpack {
  constructor(options) {
    super(options);
  }
  
  get webpackConfig() {
    return merge(this.baseConfig, {
      devtool: 'source-map',
      cache: true,
      
      output: {
        path: path.join(this.options.CWD, 'dist-dev', 'web'),
      },
      
      entry: this.options.web.entry,
      
      plugins: [
        ...Object.values(this.extractCSS),
        //...Object.keys(web.dll).map(name => {
        //  return new webpack.DllReferencePlugin({
        //    context: '.',
        //    manifest: require(`./dist-dev/dll/monitoring/assets/${name}-manifest.json`),
        //  });
        //}),
        new webpack.optimize.CommonsChunkPlugin({
          name: this.options.web.sharedChunkName || 'shared',
          chunks: Object.keys(this.options.web.entry),
        }),
      ],
    });
  }
  
  build() {
    super.build(this.webpackConfig);
  }
  
  watch() {
    return super.watch(this.webpackConfig);
  }
}

module.exports = (options) => () => {
  rimraf(path.join(options.CWD, 'dist-dev', 'web'), err => {
    if (err) throw err;
    
    const builder = new Builder(options);
    builder.build();
  });
};

module.exports.Builder = Builder;