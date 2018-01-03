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
      output: {
        path: path.join(process.cwd(), 'dist', 'web'),
      },
      
      entry: this.options.web.entry,
      
      plugins: [
        new webpack.optimize.CommonsChunkPlugin({
          name: 'shared',
          chunks: Object.keys(this.options.web.entry),
        }),
        new webpack.optimize.ModuleConcatenationPlugin(),
        this.extractCSS,
        new CopyWebpackPlugin([
          ...this.options.web.static.map(dir => ({from: dir})),
        ]),
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify('production'),
          },
        }),
        new webpack.optimize.UglifyJsPlugin({
          output: {
            comments: false,
          },
          compress: {
            warnings: false,
            screw_ie8: true,
            drop_debugger: true,
            drop_console: true,
          },
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