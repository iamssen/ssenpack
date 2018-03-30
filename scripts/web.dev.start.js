const browserSync = require('browser-sync');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const proxyMiddleware = require('http-proxy-middleware');
const compression = require('compression');
const Webpack = require('./base/webpack');
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const getModulePath = require('./base/getModulePath');
const parseDllName = require('./base/parseDllName');
const finalizeWebpackConfig = require('./base/finalizeWebpackConfig');

class Builder extends Webpack {
  constructor(options) {
    super(options);
  }
  
  get webpackConfig() {
    const dllInfo = parseDllName(this.options.web.dll.name);
    
    return merge(this.baseConfig, {
      // devtool: 'cheap-module-source-map', // slow + update source map with hmr
      devtool: 'cheap-module-eval-source-map', // fast + no update source map with hmr
      cache: true,
      
      output: {
        path: this.options.CWD,
      },
      
      entry: Object.keys(this.options.web.entry).reduce((obj, name) => {
        obj[name] = [
          getModulePath(this.options, 'webpack-hot-middleware', '/client?http://localhost:' + this.options.web.port),
          getModulePath(this.options, 'webpack', '/hot/only-dev-server'),
        ].concat(
          Array.isArray(this.options.web.entry[name])
            ? this.options.web.entry[name]
            : [this.options.web.entry[name]],
        );
        return obj;
      }, {}),
      
      plugins: [
        ...Object.values(this.extractCSS),
        new webpack.DllReferencePlugin({
          context: '.',
          manifest: require(path.join(this.options.CWD, 'dist-dev', 'dll', ...dllInfo.dirs, `${dllInfo.name}-manifest.json`)),
        }),
        //...Object.keys(this.options.web.dll).map(name => {
        //  return new webpack.DllReferencePlugin({
        //    context: '.',
        //    manifest: require(path.join(this.options.CWD, 'dist-dev', 'dll', `${name}-manifest.json`)),
        //  });
        //}),
        new webpack.optimize.CommonsChunkPlugin({
          name: this.options.web.sharedChunkName || 'shared',
          chunks: Object.keys(this.options.web.entry),
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
      ],
    });
  }
  
  get browserSyncConfig() {
    const bundler = webpack(finalizeWebpackConfig(this.options, this.webpackConfig));
    
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
      ghostMode: false,
      
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