const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const { ESBuildPlugin } = require('esbuild-loader');

module.exports = merge(common, {
  mode: 'development',
  devServer: {
    port: 9000,
    contentBase: path.resolve(__dirname, './public'),
    contentBasePublicPath: '/',
    open: true,
    compress: true,
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'esbuild-loader',
        options: {
          target: 'es2017'
        }
      },
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new ESBuildPlugin(),
  ]
});
