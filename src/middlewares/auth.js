const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET =
  process.env.JWT_SECRET;

// 验证JWT token
const authMiddleware = async (req, res, next) => {
  try {
    // 从请求头获取token（支持多种格式）
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ 认证失败: 缺少Authorization头或格式不正确');
      console.log('请求头:', JSON.stringify(req.headers, null, 2));
      return res.status(401).json({
        code: 401,
        message: '未登录或token过期',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀
    
    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 查找用户
    const user = await User.findById(decoded.userId);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        code: 401,
        message: '用户不存在或已被禁用',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
    
    // 将用户信息挂载到请求对象
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      nickname: user.nickname,
      institution: user.institution,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: 'token无效',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: 'token已过期',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 可选的认证中间件（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.status === 'active') {
        req.user = {
          userId: user._id.toString(),
          email: user.email,
          nickname: user.nickname,
          institution: user.institution,
          role: user.role
        };
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败不影响请求继续
    next();
  }
};

module.exports = { authMiddleware, optionalAuth };

