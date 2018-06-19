var path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'b3js.js',
      library: 'b3js'
  }
  // externals: {
  //   lodash: {
  //     commonjs: 'd3',
  //     commonjs2: 'd3',
  //     amd: 'd3',
  //     root: 'd3'
  //   }
  // }
};
