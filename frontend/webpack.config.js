const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const path = require('path');

module.exports = {
  entry: './src/index.js', // Explicitly set the entry point
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    publicPath: '/',
  },
  resolve: {
    fallback: {
      "url": require.resolve("url/"),
      "os": require.resolve("os-browserify/browser"),
      "path": require.resolve("path-browserify"),
      "fs": false,
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "zlib": require.resolve("browserify-zlib"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "buffer": require.resolve("buffer/"),
      "util": require.resolve("util/"),
      "assert": require.resolve("assert/"),
      "constants": require.resolve("constants-browserify"),
      "vm": require.resolve("vm-browserify"),
      "tty": require.resolve("tty-browserify"),
      "querystring": require.resolve("querystring-es3"),
      "child_process": false,
      "worker_threads": false,
      "dgram": false,
      "net": false,
      "tls": false,
      "module": false,
      "process": require.resolve("process/browser"),
      "async_hooks": false,
      "fsevents": false
    }
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.node$/,
        use: 'node-loader',
      },
      {
        test: /\.d\.ts$/,
        use: 'ignore-loader',
      },
      {
        test: /@swc\/core\/binding\.js$/,
        use: 'ignore-loader',
      },
      {
        test: /esbuild|jest-worker|express|webpack-dev-server|webpack|terser-webpack-plugin/,
        use: 'ignore-loader',
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    runtimeChunk: 'single',
    minimize: true,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3000,
    historyApiFallback: true,
  },
};