const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
require('dotenv').config();  // 加载 .env 文件中的环境变量

const app = express();
const port = process.env.PORT || 3000;  // 读取环境变量中的端口，默认 3000

// 中间件配置
app.use(cors());  // 解决跨域问题
app.use(morgan('dev'));  // 请求日志
app.use(bodyParser.json());  // 解析 JSON 请求体

// 路由配置
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});