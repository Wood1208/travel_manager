import { PrismaClient } from '../../generated/prisma/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// 用户注册
export async function createUser(req, res){
  const { username, email, password } = req.body;
  try {
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error(error); // 打印出错误对象
    res.status(500).json({ error: 'Error creating user', details: error.message });
  }
}

// 用户登录
export async function loginUser(req, res) {
  const { email, password } = req.body;

  try {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 比较密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' } // 设置令牌过期时间为7天
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
}

// 用户登出
export async function logoutUser(req, res)
{
  // 登出操作通常是前端清除存储的 token，后端不需要处理
  res.status(200).json({ message: 'User logged out successfully' });
}
