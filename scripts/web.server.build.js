const Webpack = require('./base/webpack');
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const rimraf = require('rimraf');
const fs = require('fs');

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
        ...Object.values(this.extractCSS),
      ],
    });
  }
  
  build() {
    super.build(this.webpackConfig, () => {
      const json = fs.readFileSync(path.join(this.options.CWD, 'package.json'), {encoding: 'utf8'});
      fs.writeFileSync(path.join(this.options.CWD, 'dist', 'server', 'package.json'), json);
    });
  }
}

module.exports = (options) => () => {
  rimraf(path.join(options.CWD, 'dist', 'server'), err => {
    if (err) throw err;
    
    const builder = new Builder(options);
    builder.build();
  });
};