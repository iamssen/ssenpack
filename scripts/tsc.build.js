const fs = require('fs');
const path = require('path');
const glob = require('glob');
const ts = require('typescript');
const rimraf = require('rimraf');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const finalizeWebpackConfig = require('./base/finalizeWebpackConfig');

const createWebpack = ({ options, file, outFile, libraryTarget, includeNodeExternals, mode }) => {
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

  const output = {
    path: options.CWD,
    filename: outFile,
  };

  if (libraryTarget) {
    output.libraryTarget = libraryTarget;
  }

  const optimization = mode === 'production'
    ? {
      concatenateModules: true,
    }
    : {};

  const webpackConfig = {
    mode,

    devtool: 'source-map',

    entry: () => path.join(options.CWD, file),

    externals,

    output,

    resolve: {
      extensions: ['.ts', '.js', '.tsx'],
    },

    resolveLoader: {
      modules: ['node_modules', path.join(options.MODULE_HOME, 'node_modules')],
    },

    optimization,

    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          include,
          use: [
            { loader: 'awesome-typescript-loader' },
          ],
        },
      ],
    },

    plugins,
  };

  return webpack(finalizeWebpackConfig(options, webpackConfig));
};

const build = webpack => new Promise((resolve, reject) => {
  webpack.run((err, stats) => {
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
  })
});

module.exports = (options) => () => {
  const keys = Object.keys(options.tsc.entry);

  let f = -1;
  const fmax = keys.length;

  const run = () => {
    if (++f < fmax) {
      const buildOption = options.tsc.entry[keys[f]];
      build(createWebpack({ options, ...buildOption, mode: 'production' }))
        .then(() => run())
        .catch(err => console.error('😫 tsc build is failed.', err));
    } else {
      console.log('😃 tsc build is successful.');
    }
  }

  run();
}

module.exports.createWebpack = createWebpack;