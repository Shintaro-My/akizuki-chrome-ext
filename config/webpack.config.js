'use strict';

const webpack = require('webpack');
const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');
const PATHS = require('./paths');

// Merge webpack configuration files
const config = (env, argv) =>
merge(common, {
  entry: {
    popup: PATHS.src + '/popup.js',
    contentScript: PATHS.src + '/contentScript.js',
    background: PATHS.src + '/background.js',
  },
  devtool: argv.mode === 'production' ? false : 'source-map',
});

/*
const config2 = (env, argv) =>
  merge(common, {
    entry: {
    },
    devtool: argv.mode === 'production' ? false : 'source-map',
    target: 'node',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
        }
      ]
    },
    plugins: [
      new webpack.IgnorePlugin({
        resourceRegExp: /canvas/,
        contextRegExp: /jsdom$/,
      })
    ]
  });
  */

  module.exports = config;
