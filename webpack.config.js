const path = require('path');

module.exports = {
  entry: './src/index.js', // 入口文件
  output: {
    filename: 'bundle.js', // 输出文件
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production', // 使用生产模式
};
