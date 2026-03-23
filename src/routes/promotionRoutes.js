const express = require('express');
const { body } = require('express-validator');
const promotionController = require('../controllers/promotionController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const router = express.Router();

// 公开接口：获取有效推广列表
router.get('/', promotionController.getPromotions);

// 管理员接口：查看所有推广（含已删除/过期）
router.get('/admin', authMiddleware, adminMiddleware, promotionController.getAllPromotions);

// 管理员接口：创建推广
router.post('/',
  authMiddleware,
  adminMiddleware,
  [
    body('title').trim().notEmpty().withMessage('推广标题不能为空'),
    body('cover').trim().notEmpty().withMessage('封面图URL不能为空'),
    body('url').trim().notEmpty().withMessage('推广链接不能为空'),
    body('expiresAt').notEmpty().withMessage('到期时间不能为空')
  ],
  promotionController.createPromotion
);

// 管理员接口：更新推广
router.put('/:id', authMiddleware, adminMiddleware, promotionController.updatePromotion);

// 管理员接口：软删除推广
router.delete('/:id', authMiddleware, adminMiddleware, promotionController.deletePromotion);

module.exports = router;
