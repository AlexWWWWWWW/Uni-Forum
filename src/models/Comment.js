const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, '评论内容不能为空'],
    maxlength: [500, '评论内容最多500字']
  },
  floor: {
    type: String,
    required: true
  },
  replyToCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replyToFloor: {
    type: String,
    default: null
  },
  image: {
    type: String,
    default: null
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  likeCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['normal', 'deleted', 'hidden'],
    default: 'normal'
  }
}, {
  timestamps: true
});

// 索引优化
commentSchema.index({ postId: 1, createdAt: 1 });
commentSchema.index({ userId: 1 });

module.exports = mongoose.model('Comment', commentSchema);

