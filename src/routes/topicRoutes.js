const express = require('express');
const topicController = require('../controllers/topicController');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

// 获取话题列表（需要认证）（目前不使用）
router.get('/topics', authMiddleware, topicController.getTopics);

// 获取分类标签（需要认证）
router.get('/categories', authMiddleware, topicController.getCategories);

module.exports = router;

