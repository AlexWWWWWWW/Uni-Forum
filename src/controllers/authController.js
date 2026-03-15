const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const { generateVerificationCode, sendVerificationEmail } = require('../utils/emailService');

// ================= 配置区域 =================

// 1. 定义白名单映射 (域名 -> 机构代码)
// Key: 邮箱后缀 (必须小写)
// Value: 机构代码 (存入数据库 institution 字段的值)
const ALLOWED_DOMAINS = {
  'connect.hku.hk': 'HKU',
  'qq.com': 'TEST', // 测试用
  'sms.ed.ac.uk': 'EDIN',
  // 'gmail.com': 'public', 
  // 'example.edu': 'example_u'
};

// 2. 获取 institution 的辅助函数 (同时用于校验)
// 如果返回 null/undefined，说明不在白名单
const getInstitutionByEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  const domain = email.split('@')[1];
  if (!domain) return null;
  
  // 统一转小写匹配，防止大小写差异
  return ALLOWED_DOMAINS[domain.toLowerCase()];
};

// ===========================================

// 生成JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// 获取可用邮箱后缀
exports.getEmailSuffix = async (req, res) => {
  try {
    const emailSuffix = Object.keys(ALLOWED_DOMAINS);
    res.status(200).json({
      code: 200,
      message: '获取可用邮箱后缀成功',
      data: emailSuffix,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取可用邮箱后缀失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 发送验证码
exports.sendVerificationCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '参数错误：' + errors.array()[0].msg,
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const { email } = req.body;

    // 1. 防止 NoSQL 注入
    if (typeof email !== 'string') {
      return res.status(400).json({ code: 400, message: '邮箱格式错误' });
    }
  
    // 2. 白名单校验
    // 如果找不到对应的机构代码，说明不在白名单中
    if (!getInstitutionByEmail(email)) {
        return res.status(403).json({
            code: 403,
            message: '您所在的机构目前不是合作伙伴，请联系官方人员',
            data: null,
            timestamp: new Date().toISOString()
        });
    }

    // 检查5分钟内是否已发送过验证码（防刷）
    const recentCode = await VerificationCode.findOne({
      email,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) } // 1分钟内
    });

    if (recentCode) {
      return res.status(429).json({
        code: 429,
        message: '验证码发送过于频繁，请稍后再试',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 生成验证码
    const code = generateVerificationCode();

    // 保存验证码到数据库
    await VerificationCode.create({
      email,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5分钟后过期
    });

    // 发送邮件
    try {
      await sendVerificationEmail(email, code);
      
      res.status(200).json({
        code: 200,
        message: '验证码已发送，请查收邮件',
        data: {
          email,
          expiresIn: 300 // 5分钟（秒）
        }
      });
    } catch (error) {
      console.error('发送邮件失败:', error);
      return res.status(500).json({
        code: 500,
        message: '验证码发送失败，请稍后重试',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 验证码登录
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '参数错误：' + errors.array()[0].msg,
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const { email, code } = req.body;

    // 查找最新的验证码
    const verificationCode = await VerificationCode.findOne({
      email,
      code,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!verificationCode) {
      return res.status(400).json({
        code: 400,
        message: '验证码错误或已过期',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 标记验证码为已使用
    verificationCode.isUsed = true;
    await verificationCode.save();

    // 查找或创建用户
    let user = await User.findOne({ email });
    
    if (!user) {
      // 首次登录，自动创建用户
      // 从邮箱域名提取institution（例如：alex03w@connect.hku.hk -> hku）
      // 测试：如果域名是qq.com，测试时提取hku
      const emailDomain = email.split('@')[1];
      let institution = emailDomain;
      
      // 如果域名包含点，提取主域名部分
      if (emailDomain.includes('.')) {
        const parts = emailDomain.split('.');
        // 对于类似 connect.hku.hk 的域名，提取 hku
        // 对于类似 example.com 的域名，提取 example
        institution = parts.length > 2 ? parts[parts.length - 2] : parts[0];
       
        // 测试：如果域名是qq.com，测试时提取hku
        if (emailDomain === 'qq.com') {
          institution = 'hku';
        }
      }
      
      user = new User({
        email,
        nickname: email.split('@')[0], // 默认昵称为邮箱前缀
        institution: institution // 从邮箱域名提取institution
      });
      await user.save();
    } else {
      // 检查用户状态
      if (user.status !== 'active') {
        return res.status(403).json({
          code: 403,
          message: '账号已被禁用',
          data: null,
          timestamp: new Date().toISOString()
        });
      }
      
      // 更新最后登录时间
      user.lastLoginAt = new Date();
      await user.save();
    }

    // 生成token
    const token = generateToken(user._id);

    res.status(200).json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        userId: user._id.toString(),
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        expiresIn: 86400 // 24小时（秒）
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 获取当前用户信息
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      code: 200,
      message: '获取成功',
      data: {
        userId: user._id.toString(),
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        postCount: user.postCount,
        commentCount: user.commentCount,
        favoriteCount: user.favoriteCount,
        lastLoginAt: user.lastLoginAt.toISOString()
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 更新用户信息
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '参数错误：' + errors.array()[0].msg,
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const { nickname, avatar } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 更新字段
    if (nickname !== undefined) user.nickname = nickname;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      code: 200,
      message: '更新成功',
      data: {
        userId: user._id.toString(),
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};
