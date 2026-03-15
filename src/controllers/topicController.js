const Post = require('../models/Post');

// 获取话题列表，目前无用（暂时废弃）
exports.getTopics = async (req, res) => {
  const topicOptions = [
    { id: 'write', name: '随写' , order:1},
    { id: 'emotion', name: '情感' , order:2},
    { id: 'academic', name: '学业' , order:3},
    { id: 'job', name: '求职' , order:4},
    { id: 'trade', name: '交易' , order:5},
    { id: 'food', name: '美食' , order:6},
  ];
  try {
    // 统计每个话题的帖子数
    const topicsWithCount = await Promise.all(
      topicOptions.map(async (topic) => {
        const count = await Post.countDocuments({ 
          topic: topic.name, 
          status: 'normal' 
        });
        return {
          ...topic,
          icon: '',
          postCount: count
        };
      })
    );

    res.status(200).json({
      code: 200,
      message: '获取成功',
      data: {
        topics: topicsWithCount
      }
    });
  } catch (error) {
    console.error('获取话题列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 获取分类标签（topics和categories都使用这个API），用于forum-index和post-create页面
exports.getCategories = async (req, res) => {
  const topicOptions = [
    { id: 'all', label: '全部' , order:0, showForCreate: false},
    { id: 'hot', label: '热榜' , order:1, icon: 'fire', showForCreate: false},
    { id: '随写', label: '随写' , order:2, showForCreate: true},
    { id: '情感', label: '情感' , order:3, showForCreate: true},
    { id: '学业', label: '学业' , order:4, showForCreate: true},
    { id: '求职', label: '求职' , order:5, showForCreate: true},
    { id: '交易', label: '交易' , order:6, showForCreate: true},
    { id: '美食', label: '美食' , order:7, showForCreate: true},
  ];
  try {
    const categories = topicOptions.map(topic => ({
      id: topic.id,
      label: topic.label,
      icon: topic.icon || '',
      order: topic.order,
      showForCreate: topic.showForCreate
    }));

    res.status(200).json({
      code: 200,
      message: '获取成功',
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('获取分类标签错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

