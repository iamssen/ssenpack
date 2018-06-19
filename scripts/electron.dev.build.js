const Webpack = require('./base/webpack');
const path = require('path');
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const rimraf = require('rimraf');

class Builder extends Webpack {
  constructor(options) {
    super(options);
  }
  
  get webpackConfig() {
    return merge(this.getConfig({mode: 'development', extractCSS: true}), {
      target: 'node',
      devtool: 'source-map',
      
      entry: this.options.web.entry,
      
      output: {
        path: path.join(this.options.CWD, 'dist-dev', 'electron'),
        libraryTarget: 'commonjs2',
      },
      
      plugins: [
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
  rimraf(path.join(options.CWD, 'dist-dev', 'electron'), err => {
    if (err) throw err;
    
    const builder = new Builder(options);
    builder.build();
  });
};

module.exports.Builder = Builder;