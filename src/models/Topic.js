const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  // 话题唯一标识（如：'casual', 'emotion', 'study'等，使用英文）
  id: {
    type: String,
    required: true,
    trim: true
  },
  // 话题显示名称
  label: {
    type: String,
    required: true,
    trim: true
  },
  // 话题图标（可选）
  icon: {
    type: String,
    default: ''
  },
  // 排序顺序（数字越小越靠前）
  order: {
    type: Number,
    default: 99
  },
  // 是否在创建帖子时显示
  showForCreate: {
    type: Boolean,
    default: true
  },
  // 是否启用（软删除标记）
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 索引
topicSchema.index({ id: 1 }, { unique: true });
topicSchema.index({ order: 1 });
topicSchema.index({ isActive: 1 });

module.exports = mongoose.model('Topic', topicSchema);
