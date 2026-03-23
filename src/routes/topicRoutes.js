const express = require('express');
const topicController = require('../controllers/topicController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const router = express.Router();

// 公共路由：获取话题分类列表（需要认证）
// 用于 forum-index 和 post-create 页面
router.get('/topics', authMiddleware, topicController.getTopics);

// 兼容旧的 API 路径（指向同一个 handler）
router.get('/categories', authMiddleware, topicController.getTopics);

// 管理员路由：话题管理
// 获取所有话题（包括未启用的）
router.get('/admin/topics', authMiddleware, adminMiddleware, topicController.getAllTopics);

// 创建新话题
router.post('/admin/topics', authMiddleware, adminMiddleware, topicController.createTopic);

// 更新话题
router.put('/admin/topics/:id', authMiddleware, adminMiddleware, topicController.updateTopic);

// 删除话题（软删除）
router.delete('/admin/topics/:id', authMiddleware, adminMiddleware, topicController.deleteTopic);

module.exports = router;
