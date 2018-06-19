const Webpack = require('./base/webpack');
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const rimraf = require('rimraf');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

class Builder extends Webpack {
  constructor(options) {
    super(options);
  }
  
  get webpackConfig() {
    return merge(this.getConfig({mode: 'production', extractCSS: true}), {
      output: {
        path: path.join(this.options.CWD, 'dist', 'web'),
      },
      
      entry: this.options.web.entry,
      
      optimization: {
        concatenateModules: true,
        minimize: true,
        minimizer: [
          new UglifyJsPlugin({
            uglifyOptions: {
              output: {
                comments: false,
              },
              compress: {
                warnings: false,
                drop_debugger: true,
                drop_console: true,
              },
            },
          }),
        ],
      },
      
      plugins: [
        new CopyWebpackPlugin([
          ...this.options.web.static.map(dir => ({from: dir})),
        ]),
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify('production'),
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
  rimraf(path.join(options.CWD, 'dist', 'web'), err => {
    if (err) throw err;
    
    const builder = new Builder(options);
    builder.build();
  });
};