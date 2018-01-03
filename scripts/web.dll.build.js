const Webpack = require('./base/webpack');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const rimraf = require('rimraf');
const nodeExternals = require('webpack-node-externals');
const {CheckerPlugin} = require('awesome-typescript-loader');

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