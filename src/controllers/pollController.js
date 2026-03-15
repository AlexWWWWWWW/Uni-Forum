const { validationResult } = require('express-validator');
const Post = require('../models/Post');
const { Poll, PollOption, PollVote } = require('../models/Poll');

// 获取投票详情
exports.getPollDetail = async (req, res) => {
  try {
    const { postId } = req.params;

    // 检查帖子是否存在
    const post = await Post.findOne({ _id: postId, status: 'normal' });
    if (!post) {
      return res.status(404).json({
        code: 404,
        message: '帖子不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 查询投票
    const poll = await Poll.findOne({ postId, status: 'active' });
    if (!poll) {
      return res.status(404).json({
        code: 404,
        message: '该帖子没有投票',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 查询投票选项
    const options = await PollOption.find({ pollId: poll._id }).sort({ sortOrder: 1 });

    // 查询用户的投票记录
    let userVotes = [];
    if (req.user) {
      const votes = await PollVote.find({ 
        pollId: poll._id, 
        userId: req.user.userId 
      });
      userVotes = votes.map(v => v.optionId.toString());
    }

    // 计算百分比
    const optionsData = options.map(option => {
      const percentage = poll.totalVotes > 0 
        ? parseFloat(((option.voteCount / poll.totalVotes) * 100).toFixed(2))
        : 0;
      
      return {
        id: option._id.toString(),
        text: option.text,
        voteCount: option.voteCount,
        percentage,
        isVoted: userVotes.includes(option._id.toString())
      };
    });

    // 检查是否已结束
    const isEnded = poll.endTime && new Date(poll.endTime) < new Date();

    res.status(200).json({
      code: 200,
      message: '获取成功',
      data: {
        pollId: poll._id.toString(),
        topic: poll.topic,
        allowMultiple: poll.allowMultiple,
        totalVotes: poll.totalVotes,
        options: optionsData,
        userVoted: userVotes.length > 0,
        userVotes,
        endTime: poll.endTime,
        isEnded
      }
    });
  } catch (error) {
    console.error('获取投票详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 提交投票
exports.vote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '参数错误：' + errors.array()[0].msg,
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const { postId } = req.params;
    let { optionIds } = req.body; // optionIds 现在是用户期望的最终选项列表

    // 确保 optionIds 是数组，即使为空
    if (!Array.isArray(optionIds)) {
      optionIds = [];
    }

    // 检查帖子是否存在
    const post = await Post.findOne({ _id: postId, status: 'normal' });
    if (!post) {
      return res.status(404).json({
        code: 404,
        message: '帖子不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 查询投票
    const poll = await Poll.findOne({ postId, status: 'active' });
    if (!poll) {
      return res.status(404).json({
        code: 404,
        message: '该帖子没有投票',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 检查是否已结束
    if (poll.endTime && new Date(poll.endTime) < new Date()) {
      return res.status(400).json({
        code: 400,
        message: '投票已结束',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 如果不允许选择多个选项，且用户提交了多个选项，则报错
    if (!poll.allowMultiple && optionIds.length > 1) {
      return res.status(400).json({
        code: 400,
        message: '该投票不允许多选',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 验证提交的选项是否有效且属于当前投票
    if (optionIds.length > 0) {
      const validOptions = await PollOption.find({ 
        pollId: poll._id, 
        _id: { $in: optionIds } 
      });
      if (validOptions.length !== optionIds.length) {
        return res.status(400).json({
          code: 400,
          message: '提交的选项包含无效项',
          data: null,
          timestamp: new Date().toISOString()
        });
      }
    }

    // 获取用户当前的投票记录
    const existingVotes = await PollVote.find({ 
      pollId: poll._id, 
      userId: req.user.userId 
    });
    const existingOptionIds = new Set(existingVotes.map(v => v.optionId.toString()));
    const newOptionIdsSet = new Set(optionIds.map(id => id.toString()));

    const optionsToAdd = [];
    const optionsToRemove = [];

    // 找出需要新增的选项
    for (const newId of newOptionIdsSet) {
      if (!existingOptionIds.has(newId)) {
        optionsToAdd.push(newId);
      }
    }

    // 找出需要移除的选项
    for (const existingId of existingOptionIds) {
      if (!newOptionIdsSet.has(existingId)) {
        optionsToRemove.push(existingId);
      }
    }

    // 执行数据库操作
    if (optionsToAdd.length > 0) {
      const voteRecords = optionsToAdd.map(optionId => ({
        pollId: poll._id,
        optionId,
        userId: req.user.userId
      }));
      await PollVote.insertMany(voteRecords);
      await PollOption.updateMany(
        { _id: { $in: optionsToAdd } },
        { $inc: { voteCount: 1 } }
      );
    }

    if (optionsToRemove.length > 0) {
      await PollVote.deleteMany({ 
        pollId: poll._id, 
        userId: req.user.userId,
        optionId: { $in: optionsToRemove }
      });
      await PollOption.updateMany(
        { _id: { $in: optionsToRemove } },
        { $inc: { voteCount: -1 } }
      );
    }

    // 更新总投票数
    const totalVotesChange = optionsToAdd.length - optionsToRemove.length;
    if (totalVotesChange !== 0) {
      await Poll.findByIdAndUpdate(poll._id, { 
        $inc: { totalVotes: totalVotesChange } 
      });
    }

    // 获取更新后的数据
    const updatedPoll = await Poll.findById(poll._id);
    const updatedOptions = await PollOption.find({ pollId: poll._id }).sort({ sortOrder: 1 });

    const optionsData = updatedOptions.map(option => {
      const percentage = updatedPoll.totalVotes > 0 
        ? parseFloat(((option.voteCount / updatedPoll.totalVotes) * 100).toFixed(2))
        : 0;
      
      return {
        id: option._id.toString(),
        voteCount: option.voteCount,
        percentage
      };
    });

    // 计算最终用户投票状态（新增 - 旧有的已移除）
    const finalUserVotes = [...existingOptionIds]
      .filter(id => !optionsToRemove.includes(id))
      .concat(optionsToAdd);

    res.status(200).json({
      code: 200,
      message: optionIds.length === 0 ? '已取消投票' : '投票成功',
      data: {
        pollId: updatedPoll._id.toString(),
        totalVotes: updatedPoll.totalVotes,
        options: optionsData,
        userVotes: finalUserVotes,
        userVoted: finalUserVotes.length > 0
      }
    });
  } catch (error) {
    console.error('投票错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

