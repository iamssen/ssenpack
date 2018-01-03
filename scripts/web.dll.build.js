const Webpack = require('./base/webpack');
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');

class Builder extends Webpack {
  constructor(options) {
    super(options);
  }
  
  get webpackConfig() {
    return merge(this.baseConfig, {
      devtool: 'source-map',
      
      output: {
        path: path.join(this.options.CWD, 'dist-dev', 'dll'),
        library: '[name]_lib',
      },
      
      entry: this.options.web.dll,
      
      plugins: [
        new webpack.DllPlugin({
          path: path.join(this.options.CWD, 'dist-dev', 'dll', '[name]-manifest.json'),
          name: '[name]_lib',
        }),
      ],
    });
  }
  
  build() {
    super.build(this.webpackConfig);
  }
}

module.exports = (options) => () => {
  const builder = new Builder(options);
  builder.build();
};