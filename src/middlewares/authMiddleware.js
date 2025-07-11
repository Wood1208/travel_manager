import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log("Token received:", token); // 添加日志，查看接收到的 token
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // 验证 token 并提取出 payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // 将用户信息存储到请求中
    next(); // 继续处理请求
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
