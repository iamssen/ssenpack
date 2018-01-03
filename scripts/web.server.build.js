const Webpack = require('./base/webpack');
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');

class Builder extends Webpack {
  constructor(options) {
    super(options);
  }
  
  get webpackConfig() {
    return merge(this.baseConfig, {
      target: 'node',
      devtool: 'source-map',
      
      entry: {
        index: this.options.server.entry,
      },
      
      output: {
        path: path.join(this.options.CWD, 'dist', 'server'),
        libraryTarget: 'commonjs',
      },
      
      externals: [nodeExternals()],
      
      plugins: [
        new webpack.optimize.ModuleConcatenationPlugin(),
        this.extractCSS,
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