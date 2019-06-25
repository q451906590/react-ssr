'use strict';

const path = require('path');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const config = require('./env');
const utils = require('./utils');
//webpack-node-externals的目的是为了防止node_modules目录下的第三方模块被打包进去，因为nodejs默认会去node_modules目录下去寻找和使用第三方模块。
const nodeExternals = require('webpack-node-externals');

const DEV_MODE = config.isDevMode();
const APP_PATH = utils.APP_PATH;

const prefix = utils.normalizeTailSlash(
  utils.normalizePublicPath(
    path.join(config.getAppPrefix(), config.getStaticPrefix())
  ),
  config.isPrefixTailSlashEnabled()
);

const webpackConfig = webpackMerge(
  {},
  {
    entry: {
      main: utils.resolve('src/ssr/index.tsx'),
    },
    target: 'node',
    mode: DEV_MODE ? 'development' : 'production',
    output: {
      path: utils.resolve('build/node'),
      filename: '[name].js',
      libraryExport: 'default',
      libraryTarget: 'commonjs2',
    },
    externals: [
      nodeExternals({
        whitelist: [/\.(?!(?:jsx?|json)$).{1,5}$/i],
      }),
    ],
    resolve: {
      ...utils.getWebpackResolveConfig(),
    },
    module: {
      rules: [
        ...utils.getBabelLoader(true),
        ...utils.getAllStyleRelatedLoaders(
          DEV_MODE,
          false,
          true,
          undefined,
          true
        ),
        utils.getImageLoader(DEV_MODE, APP_PATH),
        utils.getMediaLoader(DEV_MODE, APP_PATH),
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        __isBrowser__: false,
        __pathPrefix__: JSON.stringify(prefix),
      }),
      new webpack.LoaderOptionsPlugin({
        debug: DEV_MODE,
        // loader 是否要切换到优化模式。
        minimize: !DEV_MODE,
        options: {
          context: APP_PATH,
        },
      }),
      // new MiniCssExtractPlugin({
      //   filename: "[name].css",
      //   chunkFilename: "[id].css"
      // }),
    ],
  }
);

module.exports = webpackConfig;
