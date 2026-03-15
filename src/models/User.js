const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '邮箱格式不正确']
  },
  nickname: {
    type: String,
    trim: true,
    maxlength: [50, '昵称最多50个字符'],
    default: function() {
      // 默认昵称为邮箱前缀
      return this.email.split('@')[0];
    }
  },
  avatar: {
    type: String,
    default: 'https://example.com/avatar/default.jpg'
  },
  postCount: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  },
  favoriteCount: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['superAdmin', 'admin', 'teacher', 'student'],
    default: 'student',
    required: true
  },
  institution: {
    type: String,
    required: [true, 'institution不能为空'],
    trim: true,
    maxlength: [100, 'institution最多100字符']
  },
  status: {
    type: String,
    enum: ['active', 'banned', 'deleted'],
    default: 'active'
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 转换为JSON时隐藏敏感信息
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  return obj;
};

module.exports = mongoose.model('User', userSchema);
