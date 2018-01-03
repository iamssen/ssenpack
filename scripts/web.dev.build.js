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
      cache: true,
      
      output: {
        path: path.join(this.options.CWD, 'dist-dev', 'web'),
      },
      
      entry: this.options.web.entry,
      
      plugins: [
        this.extractCSS,
        //...Object.keys(web.dll).map(name => {
        //  return new webpack.DllReferencePlugin({
        //    context: '.',
        //    manifest: require(`./dist-dev/dll/monitoring/assets/${name}-manifest.json`),
        //  });
        //}),
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