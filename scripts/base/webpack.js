const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const rimraf = require('rimraf');
const nodeExternals = require('webpack-node-externals');
const {CheckerPlugin} = require('awesome-typescript-loader');

module.exports = class {
  constructor(options) {
    this.options = options;
    this.extractCSS = new ExtractTextPlugin({filename: '[name].css', allChunks: true});
  }
  
  build(config) {
    webpack(config).run((err, stats) => {
      if (err) {
        console.error(err);
      } else {
        console.log(stats.toString({
          chunks: true,
          colors: true,
        }));
      }
    });
  }
  
  watch(config) {
    return webpack(config).watch({}, (err, stats) => {
      if (err) {
        console.error(err);
      } else {
        console.log(stats.toString({
          chunks: true,
          colors: true,
        }));
      }
    });
  }
  
  get alias() {
    /** @type string */
    const src = path.join(this.options.CWD, 'src');
    /** @type {Object.<string, string>} */
    const alias = {};
    
    fs.readdirSync(src)
      .filter(dir => dir[0] !== '_')
      .map(dir => path.join(src, dir))
      .filter(dir => fs.statSync(dir).isDirectory())
      .forEach(dir => {
        alias[path.basename(dir)] = path.resolve(this.options.CWD, dir);
      });
    
    fs.readdirSync(path.join(src, '_library'))
      .map(dir => path.join(src, '_library', dir))
      .filter(dir => fs.statSync(dir).isDirectory())
      .forEach(dir => {
        alias[path.basename(dir)] = path.resolve(this.options.CWD, dir);
      });
    
    return alias;
  };
  
  get baseConfig() {
    /** @type string */
    const src = path.join(this.options.CWD, 'src');
    
    return {
      target: 'web',
      
      output: {
        path: this.options.CWD,
        publicPath: '',
        filename: '[name].js',
        sourceMapFilename: '[file].map',
        chunkFilename: '[id].chunk.js',
      },
      
      plugins: [
        new CheckerPlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(false),
      ],
      
      resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: this.alias,
      },
      
      resolveLoader: {
        modules: ['node_modules', path.join(this.options.MODULE_HOME, 'node_modules')],
      },
      
      externals: this.options.web.externals,
      
      module: {
        rules: [
          {
            test: /\.(ts|tsx)$/,
            include: src,
            use: [
              {loader: 'awesome-typescript-loader'},
            ],
          },
          {
            test: /\.css$/,
            include: src,
            use: this.extractCSS.extract({
              fallback: 'style-loader',
              use: [
                {
                  loader: 'css-loader',
                  options: {
                    sourceMap: true,
                    url: false,
                    modules: true,
                    localIdentName: '[name]__[local]___[hash:base64:5]',
                    importLoaders: 1,
                  },
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    config: {
                      path: path.join(__dirname, 'base', 'postcss.config.js'),
                    },
                  },
                },
              ],
            }),
          },
          {
            test: /\.scss$/,
            include: src,
            use: this.extractCSS.extract({
              fallback: 'style-loader',
              use: [
                {
                  loader: 'css-loader',
                  options: {
                    sourceMap: true,
                    url: false,
                    modules: true,
                    localIdentName: '[name]__[local]___[hash:base64:5]',
                    importLoaders: 2,
                  },
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    config: {
                      path: path.join(__dirname, 'base', 'postcss.config.js'),
                    },
                  },
                },
                {
                  loader: 'sass-loader',
                },
              ],
            }),
          },
          //{
          //  test: /\.js$/,
          //  enforce: 'pre',
          //  use: [
          //    {loader: 'source-map-loader'},
          //  ],
          //},
          {
            test: /\.html$/,
            include: src,
            use: [
              {loader: 'raw-loader'},
            ],
          },
          {
            test: /\.txt$/,
            include: src,
            use: [
              {loader: 'raw-loader'},
            ],
          },
          {
            test: /\.md$/,
            include: src,
            use: [
              {loader: 'raw-loader'},
              {loader: 'markdown-loader'},
            ],
          },
        ],
      },
    };
  };
};