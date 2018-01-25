const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const {CheckerPlugin} = require('awesome-typescript-loader');

module.exports = class {
  constructor(options) {
    this.options = options;
    this.extractCSS = {
      default: new ExtractTextPlugin({filename: '[name].css', allChunks: true}),
    };
    
    if (options.style && options.style.themes) {
      Object.keys(options.style.themes).forEach(name => {
        this.extractCSS[name] = new ExtractTextPlugin({filename: `[name].${name}.css`, allChunks: true});
      });
    }
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
    const cssOptions = (importLoaders) => ({
      sourceMap: true,
      url: false,
      importLoaders,
    });
    
    const cssModuleOptions = (importLoaders) => ({
      sourceMap: true,
      url: false,
      modules: true,
      localIdentName: '[name]__[local]___[hash:base64:5]',
      importLoaders,
    });
    
    /** @type string */
    const src = path.join(this.options.CWD, 'src');
    
    const cssRules = [
      {
        test: file => {
          return /\.css$/.test(file)
            && (
              !this.options.style
              || !this.options.style.themes
              || Object.keys(this.options.style.themes).every(name => !new RegExp(`\.${name}\.css$`).test(file))
            );
        },
        include: src,
        use: this.extractCSS.default.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: cssOptions(1),
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
        test: file => {
          return /\.scss$/.test(file)
            && (
              !this.options.style
              || !this.options.style.themes
              || Object.keys(this.options.style.themes).every(name => !new RegExp(`\.${name}\.scss$`).test(file))
            );
        },
        include: src,
        use: this.extractCSS.default.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: cssOptions(2),
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
    ];
    
    
    if (this.options.style && this.options.style.themes) {
      Object.keys(this.options.style.themes).forEach(name => {
        const theme = this.options.style.themes[name];
        cssRules.push(
          {
            test: new RegExp(`\.${name}\.css$`),
            include: src,
            use: this.extractCSS[name].extract({
              fallback: 'style-loader',
              use: [
                {
                  loader: 'css-loader',
                  options: theme.cssModule === true ? cssModuleOptions(1) : cssOptions(1),
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
            test: new RegExp(`\.${name}\.scss$`),
            include: src,
            use: this.extractCSS[name].extract({
              fallback: 'style-loader',
              use: [
                {
                  loader: 'css-loader',
                  options: theme.cssModule === true ? cssModuleOptions(2) : cssOptions(2),
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
        );
      });
    }
    
    const chunkFileDirectory = typeof this.options.web.chunkFileDirectory === 'string'
      ? /\/$/.test(this.options.web.chunkFileDirectory)
        ? this.options.web.chunkFileDirectory
        : this.options.web.chunkFileDirectory + '/'
      : '';
    
    return {
      target: 'web',
      
      output: {
        path: this.options.CWD,
        publicPath: this.options.web.publicPath || '',
        filename: '[name].js',
        sourceMapFilename: '[file].map',
        chunkFilename: chunkFileDirectory + '[id].[chunkhash].chunk.js',
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
          ...cssRules,
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