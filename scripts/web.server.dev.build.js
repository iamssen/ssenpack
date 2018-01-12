const Webpack = require('./base/webpack');
const path = require('path');
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
        path: path.join(this.options.CWD, 'dist-dev', 'server'),
        libraryTarget: 'commonjs',
      },
      
      plugins: [
        ...Object.values(this.extractCSS),
      ],
      
      externals: [nodeExternals()],
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