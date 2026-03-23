const Post = require('../models/Post');
const Topic = require('../models/Topic');

// 获取话题分类列表，用于forum-index和post-create页面
exports.getTopics = async (req, res) => {
  try {
    // 从数据库获取所有启用的话题，按order排序
    const topics = await Topic.find({ isActive: true }).sort({ order: 1 });

    // 添加固定的特殊分类（全部、热榜）
    const categories = [
      { id: 'all', label: '全部', order: 0, icon: '', showForCreate: false },
      { id: 'hot', label: '热榜', order: 1, icon: 'fire', showForCreate: false },
      ...topics.map(topic => ({
        id: topic.id,
        label: topic.label,
        icon: topic.icon || '',
        order: topic.order,
        showForCreate: topic.showForCreate
      }))
    ];

    res.status(200).json({
      code: 200,
      message: '获取成功',
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('获取话题分类错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 管理员：创建新话题
exports.createTopic = async (req, res) => {
  try {
    const { id, label, icon, order, showForCreate } = req.body;

    // 验证必填字段
    if (!id || !label) {
      return res.status(400).json({
        code: 400,
        message: 'id和label为必填字段',
        data: null
      });
    }

    // 检查话题ID是否已存在
    const existingTopic = await Topic.findOne({ id });
    if (existingTopic) {
      return res.status(400).json({
        code: 400,
        message: '话题ID已存在',
        data: null
      });
    }

    // 创建新话题
    const newTopic = new Topic({
      id,
      label,
      icon: icon || '',
      order: order || 99,
      showForCreate: showForCreate !== false,
      isActive: true
    });

    await newTopic.save();

    res.status(201).json({
      code: 201,
      message: '话题创建成功',
      data: {
        topic: newTopic
      }
    });
  } catch (error) {
    console.error('创建话题错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 管理员：更新话题
exports.updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, icon, order, showForCreate, isActive } = req.body;

    const topic = await Topic.findOne({ id });
    if (!topic) {
      return res.status(404).json({
        code: 404,
        message: '话题不存在',
        data: null
      });
    }

    // 更新字段
    if (label !== undefined) topic.label = label;
    if (icon !== undefined) topic.icon = icon;
    if (order !== undefined) topic.order = order;
    if (showForCreate !== undefined) topic.showForCreate = showForCreate;
    if (isActive !== undefined) topic.isActive = isActive;

    await topic.save();

    res.status(200).json({
      code: 200,
      message: '话题更新成功',
      data: {
        topic
      }
    });
  } catch (error) {
    console.error('更新话题错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 管理员：删除话题（软删除，设置为不活跃）
exports.deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findOne({ id });
    if (!topic) {
      return res.status(404).json({
        code: 404,
        message: '话题不存在',
        data: null
      });
    }

    // 检查是否有帖子使用该话题（使用 topic.id 进行关联）
    const postCount = await Post.countDocuments({ topic: topic.id, status: 'normal' });
    if (postCount > 0) {
      return res.status(400).json({
        code: 400,
        message: `该话题下还有${postCount}个帖子，无法删除`,
        data: { postCount }
      });
    }

    // 软删除：设置为不活跃
    topic.isActive = false;
    await topic.save();

    res.status(200).json({
      code: 200,
      message: '话题已禁用',
      data: {
        topic
      }
    });
  } catch (error) {
    console.error('删除话题错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 管理员：获取所有话题（包括未启用的）
exports.getAllTopics = async (req, res) => {
  try {
    const topics = await Topic.find({}).sort({ order: 1 });

    res.status(200).json({
      code: 200,
      message: '获取成功',
      data: {
        topics
      }
    });
  } catch (error) {
    console.error('获取所有话题错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};
