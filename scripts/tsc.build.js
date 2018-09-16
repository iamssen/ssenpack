const fs = require('fs');
const path = require('path');
const glob = require('glob');
const ts = require('typescript');
const rimraf = require('rimraf');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const finalizeWebpackConfig = require('./base/finalizeWebpackConfig');

const build = ({options, file, outFile, includeNodeExternals}) => new Promise((resolve, reject) => {
  const include = file => {
    return file.indexOf(path.resolve(options.CWD, path.join(options.CWD, 'src'))) === 0;
  };
  
  const plugins = [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ];

  const externals = includeNodeExternals
    ? []
    : [nodeExternals()];
  
  const webpackConfig = {
    mode: 'production',
    
    devtool: 'source-map',
    
    entry: () => path.join(options.CWD, file),
    
    externals,
    
    output: {
      path: options.CWD,
      filename: outFile,
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
  let f = -1;
  const fmax = options.tsc.entry.length;

  const run = () => {
    if (++f < fmax) {
      const buildOption = options.tsc.entry[f];
      build({options, ...buildOption})
        .then(() => run())
        .catch(err => console.error('😫 build tsc files are failed.', err));
    } else {
      console.log('😃 Build all tsc files are successful.');
    }
  }

  run();
}