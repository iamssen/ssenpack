const Webpack = require('./base/webpack');
const path = require('path');
const merge = require('webpack-merge');
const rimraf = require('rimraf');

class Builder extends Webpack {
  constructor(options) {
    super(options);
  }
  
  get webpackConfig() {
    return merge(this.getConfig({mode: 'development', extractCSS: true}), {
      devtool: 'source-map',
      cache: true,
      
      output: {
        path: path.join(this.options.CWD, 'dist-dev', 'web'),
      },
      
      entry: this.options.web.entry,
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