var path = require('path');

module.exports = {
  entry: ['./src/index.js', './src/ColumnChart.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'b3js.js',
      library: 'b3js'
  }
};
