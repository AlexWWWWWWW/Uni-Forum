const express = require('express');
const { body } = require('express-validator');
const pollController = require('../controllers/pollController');
const { authMiddleware, optionalAuth } = require('../middlewares/auth');
const { interactionLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// 获取投票详情（需要认证）
router.get('/posts/:postId/poll', authMiddleware, pollController.getPollDetail);

// 提交投票（需要认证和限流）
router.post('/posts/:postId/poll/vote',
  authMiddleware,
  interactionLimiter,
  [
    body('optionIds')
      .isArray()
      .withMessage('选项必须是一个数组')
  ],
  pollController.vote
);

module.exports = router;

