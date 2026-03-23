const Promotion = require('../models/Promotion');

// GET /api/promotions — 获取有效推广列表（公开）
exports.getPromotions = async (req, res) => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({
      isDeleted: false,
      expiresAt: { $gt: now }
    })
      .sort({ sortOrder: 1, createdAt: -1 })
      .select('title cover url mpName mpAvatar sortOrder')
      .lean();

    // 用数组索引+1作为 id 返回给前端
    const data = promotions.map((item, index) => ({
      id: index + 1,
      title: item.title,
      cover: item.cover,
      url: item.url,
      mpName: item.mpName,
      mpAvatar: item.mpAvatar,
      sortOrder: item.sortOrder
    }));

    res.json({ code: 200, data });
  } catch (error) {
    console.error('获取推广列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// POST /api/promotions — 创建推广（管理员）
exports.createPromotion = async (req, res) => {
  try {
    const { title, cover, url, mpName, mpAvatar, sortOrder, expiresAt } = req.body;

    const promotion = await Promotion.create({
      title,
      cover,
      url,
      mpName: mpName ?? '',
      mpAvatar: mpAvatar ?? '',
      sortOrder: sortOrder ?? 0,
      expiresAt: new Date(expiresAt)
    });

    res.status(201).json({
      code: 201,
      message: '创建成功',
      data: promotion
    });
  } catch (error) {
    console.error('创建推广失败:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        code: 400,
        message: messages.join('; '),
        data: null,
        timestamp: new Date().toISOString()
      });
    }
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// PUT /api/promotions/:id — 更新推广（管理员）
exports.updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.expiresAt) {
      updates.expiresAt = new Date(updates.expiresAt);
    }

    const promotion = await Promotion.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!promotion) {
      return res.status(404).json({
        code: 404,
        message: '推广不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ code: 200, message: '更新成功', data: promotion });
  } catch (error) {
    console.error('更新推广失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// DELETE /api/promotions/:id — 软删除推广（管理员）
exports.deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date()
    }, { new: true });

    if (!promotion) {
      return res.status(404).json({
        code: 404,
        message: '推广不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ code: 200, message: '删除成功', data: null });
  } catch (error) {
    console.error('删除推广失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// GET /api/promotions/admin — 管理员查看所有推广（含已删除）
exports.getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({ code: 200, data: promotions });
  } catch (error) {
    console.error('获取推广列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};
