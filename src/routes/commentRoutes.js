const express = require('express');
const { body } = require('express-validator');
const commentController = require('../controllers/commentController');
const { authMiddleware, optionalAuth } = require('../middlewares/auth');
const { postLimiter } = require('../middlewares/rateLimiter');
const { uploadSingle, handleUploadError } = require('../middlewares/upload');

const router = express.Router();

// 获取帖子的评论列表（需要认证）
router.get('/posts/:postId/comments', authMiddleware, commentController.getComments);

// 发表评论（需要认证和限流）
// 支持两种图片传入方式：
//   1. multipart/form-data 直接上传图片文件（字段名：file）
//   2. application/json 或 form-data 传入已上传图片的 URL（字段名：image）
router.post('/posts/:postId/comments',
  authMiddleware,
  postLimiter,
  uploadSingle,
  handleUploadError,
  [
    body('content')
      .trim()
      .notEmpty()
      .withMessage('评论内容不能为空')
      .isLength({ max: 500 })
      .withMessage('评论内容最多500字'),
    body('isAnonymous')
      .isBoolean()
      .withMessage('isAnonymous必须是布尔值'),
    body('replyToCommentId')
      .optional(),
    body('replyToFloor')
      .optional(),
    body('image')
      .optional()
  ],
  commentController.createComment
);

// 删除评论（需要认证）
router.delete('/comments/:commentId', authMiddleware, commentController.deleteComment);

module.exports = router;

