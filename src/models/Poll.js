const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    unique: true
  },
  topic: {
    type: String,
    required: [true, '投票主题不能为空'],
    maxlength: [200, '投票主题最多200字']
  },
  allowMultiple: {
    type: Boolean,
    default: false
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  endTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'ended', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

const pollOptionSchema = new mongoose.Schema({
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true
  },
  text: {
    type: String,
    required: [true, '选项文本不能为空'],
    maxlength: [100, '选项文本最多100字']
  },
  voteCount: {
    type: Number,
    default: 0
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const pollVoteSchema = new mongoose.Schema({
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true
  },
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PollOption',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// 索引
pollOptionSchema.index({ pollId: 1 });
pollVoteSchema.index({ pollId: 1, userId: 1 });
pollVoteSchema.index({ userId: 1, optionId: 1 }, { unique: true });

const Poll = mongoose.model('Poll', pollSchema);
const PollOption = mongoose.model('PollOption', pollOptionSchema);
const PollVote = mongoose.model('PollVote', pollVoteSchema);

module.exports = { Poll, PollOption, PollVote };

