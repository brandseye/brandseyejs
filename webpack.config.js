const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: {
      "b3js": "./src/index.js",
      "b3js.min": "./src/index.js",
  },
  devServer: {
    port: 8000,
    devMiddleware: {},
    publicPath: '/dist/',
    open: true,
    openPage: 'dist/examples/fantastic.html'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: 'b3js',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  optimization: {
      minimize: true,
      minimizer: [
          new TerserPlugin({
              test: /\.min\.js$/,
          })
      ]
  },
  externals: {
    lodash: {
      commonjs: 'd3',
      commonjs2: 'd3',
      amd: 'd3',
      root: 'd3'
    }
  }
};
