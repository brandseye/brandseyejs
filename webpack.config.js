const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: {
      "b3js": "./src/index.js",
      "b3js.min": "./src/index.js",
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js', library: 'b3js'
  },
  optimization: {
      minimize: true,
      minimizer: [new UglifyJsPlugin({
          include: /\.min\.js$/
      })]
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
