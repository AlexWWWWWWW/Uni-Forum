const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// 获取可用邮箱后缀
router.get('/email-suffix', authController.getEmailSuffix);

// 发送验证码
router.post('/send-code',
  authLimiter,
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('邮箱不能为空')
      .isEmail()
      .withMessage('邮箱格式不正确')
  ],
  authController.sendVerificationCode
);

// 验证码登录（无需注册）
router.post('/login',
  authLimiter,
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('邮箱不能为空')
      .isEmail()
      .withMessage('邮箱格式不正确'),
    body('code')
      .trim()
      .notEmpty()
      .withMessage('验证码不能为空')
      .isLength({ min: 6, max: 6 })
      .withMessage('验证码必须是6位数字')
      .isNumeric()
      .withMessage('验证码必须是数字')
  ],
  authController.login
);

// 获取当前用户信息
router.get('/profile', authMiddleware, authController.getProfile);

// 更新用户信息
router.put('/profile',
  authMiddleware,
  [
    body('nickname')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('昵称长度必须在1-50个字符之间'),
    body('avatar')
      .optional()
      .trim()
      .isURL()
      .withMessage('头像必须是有效的URL')
  ],
  authController.updateProfile
);

module.exports = router;
