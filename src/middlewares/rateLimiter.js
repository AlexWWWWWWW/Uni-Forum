const rateLimit = require('express-rate-limit');

// 通用限流器
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 每个IP最多100次请求
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 发帖/评论限流器
const postLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 每分钟最多5次
  message: {
    code: 429,
    message: '发帖/评论过于频繁，请稍后再试',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 点赞/收藏限流器
const interactionLimiter = rateLimit({
  windowMs: 1000, // 1秒
  max: 10, // 每秒最多10次
  message: {
    code: 429,
    message: '操作过于频繁，请稍后再试',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录限流器
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 最多10次登录尝试
  message: {
    code: 429,
    message: '登录尝试次数过多，请稍后再试',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  postLimiter,
  interactionLimiter,
  authLimiter
};

