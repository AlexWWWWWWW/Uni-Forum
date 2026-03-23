const mongoose = require('mongoose');
const Counter = require('./Counter');

const postSchema = new mongoose.Schema({
  // 自增业务ID（从1开始）。用于对外展示/排序；MongoDB 的 _id 仍作为主键。
  postNum: {
    type: Number
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, '帖子内容不能为空'],
    maxlength: [800, '帖子内容最多800字']
  },
  topic: {
    type: String,
    required: true
    // 存储话题的 id（而非 label），例如：'technology', 'life', 'study'
    // 话题现在由 Topic 模型动态管理，验证逻辑在 controller 层进行
  },
  images: [{
    type: String
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  syncToUni: {
    type: Boolean,
    default: false
  },
  hasPoll: {
    type: Boolean,
    default: false
  },
  likeCount: {
    type: Number,
    default: 0
  },
  favoriteCount: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  // 热度分数（由定时任务计算写入）
  hotScore: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['normal', 'deleted', 'hidden'],
    default: 'normal'
  },
  // 发帖人所属学校/机构（创建时从 req.user.institution 冗余写入，便于查询隔离）
  institution: {
    type: String,
    required: [true, 'institution不能为空'],
    index: true
  }
}, {
  timestamps: true
});

postSchema.pre('save', async function () {
  if (!this.isNew || this.postNum) return;

  const counter = await Counter.findByIdAndUpdate(
    'postNum',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  this.postNum = counter.seq;
});

// 索引优化
postSchema.index({ postNum: 1 }, { unique: true, sparse: true });
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ topic: 1, createdAt: -1 });
// postSchema.index({ tag: 1, createdAt: -1 }); //废弃索引
postSchema.index({ status: 1 });
postSchema.index({ institution: 1 });
// 帖子内容全文索引（用于 $text 搜索）
postSchema.index({ content: 'text' });
// 对 hotScore 建立倒序索引（用于热榜排序）
postSchema.index({ hotScore: -1 });

module.exports = mongoose.model('Post', postSchema);

