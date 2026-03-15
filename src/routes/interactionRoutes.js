const express = require('express');
const { body } = require('express-validator');
const interactionController = require('../controllers/interactionController');
const { authMiddleware } = require('../middlewares/auth');
const { interactionLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// 点赞/取消点赞帖子
router.post('/posts/:postId/like',
  authMiddleware,
  interactionLimiter,
  [
    body('action')
      .notEmpty()
      .withMessage('action不能为空')
      .isIn(['like', 'unlike'])
      .withMessage('action必须是like或unlike')
  ],
  interactionController.likePost
);

// 收藏/取消收藏帖子
router.post('/posts/:postId/favorite',
  authMiddleware,
  interactionLimiter,
  [
    body('action')
      .notEmpty()
      .withMessage('action不能为空')
      .isIn(['add', 'remove'])
      .withMessage('action必须是add或remove')
  ],
  interactionController.favoritePost
);

// 点赞/取消点赞评论
router.post('/comments/:commentId/like',
  authMiddleware,
  interactionLimiter,
  [
    body('action')
      .notEmpty()
      .withMessage('action不能为空')
      .isIn(['like', 'unlike'])
      .withMessage('action必须是like或unlike')
  ],
  interactionController.likeComment
);

// 获取用户收藏列表
router.get('/user/favorites', authMiddleware, interactionController.getFavorites);

module.exports = router;

