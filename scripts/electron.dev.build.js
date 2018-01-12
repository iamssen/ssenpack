const Webpack = require('./base/webpack');
const path = require('path');
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

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
        ...Object.values(this.extractCSS),
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