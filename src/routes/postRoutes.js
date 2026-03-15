const express = require('express');
const { body } = require('express-validator');
const postController = require('../controllers/postController');
const { authMiddleware } = require('../middlewares/auth');
const { postLimiter } = require('../middlewares/rateLimiter');
const { uploadImages, handleUploadError } = require('../middlewares/upload');

const router = express.Router();

// 获取帖子列表（需要认证）
router.get('/', authMiddleware, postController.getPosts);

// 搜索帖子（需要认证，必须在/:postId之前）
router.get('/search', authMiddleware, postController.searchPosts);

// 获取帖子详情（需要认证）
router.get('/:postId', authMiddleware, postController.getPostById);

// 发布帖子（需要认证和限流）
router.post('/',
  authMiddleware,
  postLimiter,
  uploadImages,
  handleUploadError,
  [
    body('content')
      .trim()
      .notEmpty()
      .withMessage('帖子内容不能为空')
      .isLength({ max: 800 })
      .withMessage('帖子内容最多800字'),
    body('topic')
      .notEmpty()
      .withMessage('话题分类不能为空')
      .isIn(['随写', '情感', '学业', '求职', '交易', '美食'])
      .withMessage('话题分类不正确'),
    body('isAnonymous')
      .isBoolean()
      .withMessage('isAnonymous必须是布尔值'),
    body('syncToUni')
      .isBoolean()
      .withMessage('syncToUni必须是布尔值')
  ],
  postController.createPost
);

// 删除帖子（需要认证）
router.delete('/:postId', authMiddleware, postController.deletePost);

module.exports = router;

