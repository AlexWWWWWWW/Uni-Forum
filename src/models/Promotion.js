const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '推广标题不能为空'],
    maxlength: [100, '推广标题最多100字']
  },
  cover: {
    type: String,
    required: [true, '封面图URL不能为空']
  },
  url: {
    type: String,
    required: [true, '推广链接不能为空']
  },
  mpName: {
    type: String,
    default: ''
  },
  mpAvatar: {
    type: String,
    default: ''
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: [true, '到期时间不能为空']
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

promotionSchema.index({ isDeleted: 1, expiresAt: 1 });

module.exports = mongoose.model('Promotion', promotionSchema);
