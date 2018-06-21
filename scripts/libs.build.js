const fs = require('fs');
const path = require('path');
const glob = require('glob');
const ts = require('typescript');
const rimraf = require('rimraf');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const finalizeWebpackConfig = require('./base/finalizeWebpackConfig');
const CSSExtractPlugin = require('mini-css-extract-plugin');

const buildDeclration = ({options, name, groupDir, file}) => new Promise((resolve, reject) => {
  const program = ts.createProgram([file], {
    'module': ts.ModuleKind.CommonJS,
    'target': ts.ScriptTarget.ES5,
    'jsx': 'react',
    'skipLibCheck': true,
    'moduleResolution': ts.ModuleResolutionKind.NodeJs,
    'experimentalDecorators': true,
    'downlevelIteration': true,
    'typeRoots': [
      path.join(options.CWD, 'node_modules', '@types'),
      path.join(options.CWD, 'dist', 'libs'),
    ],
    'lib': [
      'lib.dom.d.ts',
      'lib.es2015.d.ts',
      'lib.es2016.d.ts',
    ],
    'outDir': path.join(options.CWD, 'dist', 'libs', 'js', groupDir + name),
    'declaration': true,
    'declarationDir': path.join(options.CWD, 'dist', 'libs', groupDir + name),
    'baseUrl': path.join(options.CWD, 'src'),
  });
  
  const emitResult = program.emit();
  const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
  
  allDiagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      let {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      console.log(`D1: ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    } else {
      console.log(`D2: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
    }
  });
  
  if (emitResult.emitSkipped) {
    reject(new Error(`😫 Build the declaration files of "${groupDir}${name}" is failed.`));
  } else {
    console.log(`😀 Build the declaration files of "${groupDir}${name}" is successful.`);
    resolve();
  }
});

const build = ({options, name, groupDir, file, libExternals}) => new Promise((resolve, reject) => {
  const include = file => {
    return file.indexOf(path.resolve(options.CWD, path.join(options.CWD, 'src', '_library', groupDir + name))) === 0;
  };
  
  const plugins = [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
    new CSSExtractPlugin({
      filename: path.join('dist', 'libs', groupDir + name, 'index.css'),
    }),
  ];
  
  const copyFileFrom = path.join(options.CWD, 'src', '_library', groupDir + name);
  const copyFileTo = path.join(options.CWD, 'dist', 'libs', groupDir + name);
  const copyFiles = glob.sync(copyFileFrom + '/**/!(*.ts|*.tsx)')
                        .filter(file => {
                          return fs.existsSync(file) && !fs.statSync(file).isDirectory();
                        })
                        .map(file => {
                          return {
                            from: file,
                            to: file.replace(copyFileFrom + '/', copyFileTo + '/'),
                          };
                        });
  
  if (copyFiles.length > 0) {
    plugins.push(new CopyWebpackPlugin(copyFiles));
  }
  
  const webpackConfig = {
    mode: 'production',
    
    devtool: 'source-map',
    
    entry: () => file,
    
    externals: [nodeExternals()].concat(libExternals),
    
    output: {
      path: options.CWD,
      filename: path.join('dist', 'libs', groupDir + name, 'index.js'),
      libraryTarget: 'commonjs',
    },
    
    resolve: {
      extensions: ['.ts', '.js', '.tsx'],
    },
    
    resolveLoader: {
      modules: ['node_modules', path.join(options.MODULE_HOME, 'node_modules')],
    },
    
    optimization: {
      concatenateModules: true,
      splitChunks: {
        cacheGroups: {
          ...(options.style && Array.isArray(options.style.themes)
            ? options.style.themes.reduce((cacheGroup, theme) => {
              cacheGroup[theme] = {
                name: 'theme.' + theme,
                test: m => {
                  return m.constructor.name === 'CssModule'
                    && new RegExp(`\.${theme}\.s?css`).test(m.identifier());
                },
                chunks: 'all',
                enforce: true,
              };
              return cacheGroup;
            }, {})
            : {}),
        },
      },
    },
    
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          include,
          use: [
            {loader: 'awesome-typescript-loader'},
          ],
        },
        {
          test: /\.module\.css$/,
          include,
          use: [
            CSSExtractPlugin.loader,
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
        },
        {
          test: /\.module\.scss$/,
          include,
          use: [
            CSSExtractPlugin.loader,
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
            'sass-loader',
          ],
        },
        {
          test: file => /\.css$/.test(file) && !/\.module\.css$/.test(file),
          include,
          use: [
            CSSExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
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
          include,
          use: [
            CSSExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
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
      ],
    },
    
    plugins,
  };
  
  return webpack(finalizeWebpackConfig(options, webpackConfig)).run((err, stats) => {
    if (err) {
      console.error(err);
      reject(err);
    } else {
      console.log(stats.toString({
        chunks: true,
        colors: true,
      }));
      resolve();
    }
  });
});

module.exports = (options) => () => {
  rimraf(path.join(options.CWD, 'dist', 'libs'), err => {
    if (err) throw err;
    
    const libExternals = [];
    
    const buildOptions = Object.keys(options.libs.entry).map(name => {
      const {group} = options.libs.entry[name];
      const groupDir = group ? group + '/' : '';
      const indexFile = fs.existsSync(path.join(options.CWD, 'src', '_library', groupDir + name, 'index.tsx'))
        ? 'index.tsx'
        : 'index.ts';
      const file = path.join(options.CWD, 'src', '_library', groupDir + name, indexFile);
      
      const buildOption = {
        options,
        name,
        groupDir,
        file,
        libExternals: libExternals.slice(),
      };
      
      libExternals.push(groupDir + name);
      
      return buildOption;
    });
    
    let f = -1;
    const fmax = buildOptions.length;
    
    const run = () => {
      if (++f < fmax) {
        const buildOption = buildOptions[f];
        buildDeclration(buildOption)
          .then(() => build(buildOption))
          .then(() => run())
          .catch(err => console.error('😫 Build libraries are failed.', err));
      } else {
        rimraf(path.join(options.CWD, 'dist', 'libs', 'js'), err => {
          if (err) {
            console.error(err);
          } else {
            console.log('😃 Build all libraries are successful.');
          }
        });
      }
    };
    
    run();
  });
};