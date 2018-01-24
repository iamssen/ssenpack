const Webpack = require('./base/webpack');
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const parseDllName = require('./base/parseDllName');
const rimraf = require('rimraf');

class Builder extends Webpack {
  constructor(options) {
    super(options);
  }
  
  get webpackConfig() {
    const {dirs, name} = parseDllName(this.options.web.dll.name);
    
    return merge(this.baseConfig, {
      devtool: 'source-map',
      
      output: {
        path: path.join(this.options.CWD, 'dist-dev', 'dll', ...dirs),
        library: `${name}_lib`,
        filename: `${name}.js`,
      },
      
      entry: this.options.web.dll.entry,
      
      plugins: [
        new webpack.DllPlugin({
          path: path.join(this.options.CWD, 'dist-dev', 'dll', ...dirs, `${name}-manifest.json`),
          name: `${name}_lib`,
        }),
      ],
    });
  }
  
  build() {
    super.build(this.webpackConfig);
  }
}

module.exports = (options) => () => {
  rimraf(path.join(options.CWD, 'dist-dev', 'dll'), err => {
    if (err) throw err;
    
    const builder = new Builder(options);
    builder.build();
  });
};