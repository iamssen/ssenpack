const fs = require('fs');
const path = require('path');
const glob = require('glob');
const ts = require('typescript');
const rimraf = require('rimraf');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');

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
  
  const extractCSS = {
    default: new ExtractTextPlugin({
      filename: path.join('dist', 'libs', groupDir + name, 'index.css'),
      allChunks: true,
    }),
  };
  
  if (options.style && options.style.themes) {
    Object.keys(options.style.themes).forEach(themeName => {
      extractCSS[themeName] = new ExtractTextPlugin({
        filename: path.join('dist', 'libs', groupDir + name, `index.${themeName}.css`),
        allChunks: true,
      });
    });
  }
  
  const plugins = [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    ...Object.values(extractCSS),
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
  
  const cssRules = [
    {
      test: file => {
        return /\.css$/.test(file)
          && (
            !options.style
            || !options.style.themes
            || Object.keys(options.style.themes).every(name => !new RegExp(`\.${name}\.css$`).test(file))
          );
      },
      include,
      use: extractCSS.default.extract({
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
            !options.style
            || !options.style.themes
            || Object.keys(options.style.themes).every(name => !new RegExp(`\.${name}\.scss$`).test(file))
          );
      },
      include,
      use: extractCSS.default.extract({
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
  
  if (options.style && options.style.themes) {
    Object.keys(options.style.themes).forEach(name => {
      const theme = options.style.themes[name];
      cssRules.push(
        {
          test: new RegExp(`\.${name}\.css$`),
          include,
          use: extractCSS[name].extract({
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
          include,
          use: extractCSS[name].extract({
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
  
  const webpackConfig = {
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
    
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          include,
          use: [
            {loader: 'awesome-typescript-loader'},
          ],
        },
        ...cssRules,
      ],
    },
    
    plugins,
  };
  
  return webpack(webpackConfig).run((err, stats) => {
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
            console.log('😃 Build all libraries are successful.',);
          }
        });
      }
    };
    
    run();
  });
};