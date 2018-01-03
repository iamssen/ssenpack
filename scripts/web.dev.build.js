const Webpack = require('./base/webpack');
const path = require('path');
const merge = require('webpack-merge');

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