const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const CSSExtractPlugin = require('mini-css-extract-plugin');
const {CheckerPlugin} = require('awesome-typescript-loader');
const finalizeWebpackConfig = require('./finalizeWebpackConfig');

module.exports = class {
  constructor(options) {
    this.options = options;
  }
  
  build(config, callback) {
    webpack(finalizeWebpackConfig(this.options, config)).run((err, stats) => {
      if (err) {
        console.error(err);
      } else {
        console.log(stats.toString({
          chunks: true,
          colors: true,
        }));
        
        if (typeof callback === 'function') callback();
      }
    });
  }
  
  watch(config) {
    return webpack(finalizeWebpackConfig(this.options, config)).watch({}, (err, stats) => {
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
      .filter(dir => dir[0] !== '_') // _directory와 같이 _ 로 시작하는 모든 디렉토리 제외
      .map(dir => path.join(src, dir))
      .filter(dir => fs.statSync(dir).isDirectory())
      .forEach(dir => {
        alias[path.basename(dir)] = path.resolve(this.options.CWD, dir);
      });
    
    fs.readdirSync(path.join(src, '_library')) // _library 디렉토리 안의 모든 디렉토리를 읽어냄
      .map(dir => path.join(src, '_library', dir))
      .filter(dir => fs.statSync(dir).isDirectory())
      .forEach(dir => {
        alias[path.basename(dir)] = path.resolve(this.options.CWD, dir);
      });
    
    return alias;
  };
  
  getConfig({mode = 'development', extractCSS = true}) {
    /** @type string */
    const src = path.join(this.options.CWD, 'src');
    
    const chunkFileDirectory = typeof this.options.web.chunkFileDirectory === 'string'
      ? /\/$/.test(this.options.web.chunkFileDirectory)
        ? this.options.web.chunkFileDirectory
        : this.options.web.chunkFileDirectory + '/'
      : '';
    
    return {
      mode,
      target: 'web',
      
      optimization: {
        splitChunks: {
          cacheGroups: {
            shared: {
              test: /[\\/]node_modules[\\/]/,
              name: 'shared',
              chunks: 'all',
            },
            ...(this.options.style && Array.isArray(this.options.style.themes)
              ? this.options.style.themes.reduce((cacheGroup, theme) => {
                cacheGroup[theme] = {
                  name: theme,
                  test: m => m.constructor.name === 'CssModule' && new RegExp(`\.${theme}\.s?css`).test(m.identifier()),
                  chunks: 'all',
                  enforce: true,
                };
                return cacheGroup;
              }, {})
              : {}),
          },
        },
      },
      
      output: {
        path: this.options.CWD,
        publicPath: this.options.web.publicPath || '',
        filename: '[name].js',
        sourceMapFilename: '[file].map',
        chunkFilename: chunkFileDirectory + '[name].js',
      },
      
      plugins: [
        new CheckerPlugin(),
        new CSSExtractPlugin({
          filename: '[name].css',
          chunkFilename: chunkFileDirectory + '[name].css',
        }),
      ],
      
      resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: this.alias,
      },
      
      resolveLoader: {
        modules: [
          'node_modules',
          path.join(this.options.MODULE_HOME, 'node_modules'),
        ],
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
            test: /\.module\.css$/,
            include: src,
            use: [
              extractCSS ? CSSExtractPlugin.loader : 'style-loader',
              {
                loader: 'css-loader',
                options: {
                  sourceMap: extractCSS,
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
          },
          {
            test: /\.module\.scss$/,
            include: src,
            use: [
              extractCSS ? CSSExtractPlugin.loader : 'style-loader',
              {
                loader: 'css-loader',
                options: {
                  sourceMap: extractCSS,
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
              'sass-loader',
            ],
          },
          {
            test: file => /\.css$/.test(file) && !/\.module\.css$/.test(file),
            include: src,
            use: [
              extractCSS ? CSSExtractPlugin.loader : 'style-loader',
              {
                loader: 'css-loader',
                options: {
                  sourceMap: extractCSS,
                  url: false,
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
          },
          {
            test: file => /\.scss$/.test(file) && !/\.module\.scss$/.test(file),
            include: src,
            use: [
              extractCSS ? CSSExtractPlugin.loader : 'style-loader',
              {
                loader: 'css-loader',
                options: {
                  sourceMap: extractCSS,
                  url: false,
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
              'sass-loader',
            ],
          },
          {
            test: /\.html$/,
            include: src,
            use: [
              'raw-loader',
            ],
          },
          {
            test: /\.txt$/,
            include: src,
            use: [
              'raw-loader',
            ],
          },
          {
            test: /\.md$/,
            include: src,
            use: [
              'raw-loader',
              'markdown-loader',
            ],
          },
        ],
      },
    };
  };
};