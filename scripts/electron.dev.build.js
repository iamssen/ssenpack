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
      target: 'node',
      devtool: 'source-map',
      
      entry: this.options.web.entry,
      
      output: {
        path: path.join(this.options.CWD, 'dist-dev', 'electron'),
        libraryTarget: 'commonjs2',
      },
      
      plugins: [
        this.extractCSS,
        new CopyWebpackPlugin([
          ...this.options.web.static.map(dir => ({from: dir})),
        ]),
      ],
      
      externals: [nodeExternals({
        whitelist: Object.keys(this.alias),
      })],
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
  const builder = new Builder(options);
  builder.build();
};

module.exports.Builder = Builder;