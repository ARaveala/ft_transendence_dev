const path = require('path');

module.exports = {
  entry: './src/index.ts',  // Adjust to your entry file
  module: {
    rules: [
      {
        test: /\.html$/,
        use: ['html-loader'],  // This allows importing HTML files
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.html'],  // Allow .ts and .html file extensions
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};

