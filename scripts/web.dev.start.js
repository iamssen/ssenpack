const browserSync = require('browser-sync');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const proxyMiddleware = require('http-proxy-middleware');
const compression = require('compression');
const Webpack = require('./base/webpack');
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');

class Builder extends Webpack {
  constructor(options) {
    super(options);
  }
  
  get webpackConfig() {
    return merge(this.baseConfig, {
      // devtool: 'cheap-module-source-map', // slow + update source map with hmr
      devtool: 'cheap-module-eval-source-map', // fast + no update source map with hmr
      cache: true,
      
      output: {
        path: this.options.CWD,
      },
      
      entry: Object.keys(this.options.web.entry).reduce((obj, name) => {
        obj[name] = [
          `${this.options.MODULE_HOME}/node_modules/webpack-hot-middleware/client?http://localhost:${this.options.web.port}`,
          `${this.options.MODULE_HOME}/node_modules/webpack/hot/only-dev-server`,
        ].concat(
          Array.isArray(this.options.web.entry[name])
            ? this.options.web.entry[name]
            : [this.options.web.entry[name]],
        );
        return obj;
      }, {}),
      
      plugins: [
        this.extractCSS,
        ...Object.keys(this.options.web.dll).map(name => {
          return new webpack.DllReferencePlugin({
            context: '.',
            manifest: require(path.join(this.options.CWD, 'dist-dev', 'dll', `${name}-manifest.json`)),
          });
        }),
        new webpack.optimize.CommonsChunkPlugin({
          name: 'shared',
          chunks: Object.keys(this.options.web.entry),
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
      ],
    });
  }
  
  get browserSyncConfig() {
    const bundler = webpack(this.webpackConfig);
    
    const middleware = [
      webpackDevMiddleware(bundler, {
        publicPath: this.webpackConfig.output.publicPath,
        stats: {colors: true},
      }),
      
      webpackHotMiddleware(bundler),
    ];
    
    if (this.options.server) {
      middleware.push(proxyMiddleware(['**', '!**/*.*'], {
        target: 'http://localhost:' + this.options.server.port,
      }));
    }
    
    middleware.push(compression());
    
    if (this.options.server && Array.isArray(this.options.server.middleware)) {
      middleware.push(...this.options.server.middleware);
    }
    
    return {
      port: this.options.web.port,
      open: false,
      
      server: {
        baseDir: [
          path.join(this.options.CWD, 'dist-dev', 'dll'),
          ...this.options.web.static.map(dir => path.resolve(this.options.CWD, dir)),
        ],
        
        middleware,
      },
      
      files: [
        path.join(this.options.CWD, 'dist-dev', 'dll'),
        ...this.options.web.static.map(dir => path.resolve(this.options.CWD, dir)),
      ],
    };
  }
  
  start() {
    browserSync(this.browserSyncConfig);
  }
}

module.exports = (options) => () => {
  const builder = new Builder(options);
  builder.start();
};