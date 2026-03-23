const { validationResult } = require('express-validator');
const path = require('path');
const Post = require('../models/Post');
const User = require('../models/User');
const PostLike = require('../models/PostLike');
const Favorite = require('../models/Favorite');
const Comment = require('../models/Comment');
const { Poll, PollOption, PollVote } = require('../models/Poll');
const Topic = require('../models/Topic');
const { generateAnonymousName } = require('../utils/anonymousName');

const buildPollDataByPostId = async (posts, userId) => {
  const postsWithPoll = posts.filter(post => post.hasPoll);
  if (postsWithPoll.length === 0) {
    return new Map();
  }

  const postIds = postsWithPoll.map(post => post._id);
  const polls = await Poll.find({ postId: { $in: postIds }, status: 'active' }).lean();
  if (polls.length === 0) {
    return new Map();
  }

  const pollIds = polls.map(poll => poll._id);
  const options = await PollOption.find({ pollId: { $in: pollIds } })
    .sort({ sortOrder: 1 })
    .lean();

  const optionsByPollId = new Map();
  options.forEach(option => {
    const pollId = option.pollId.toString();
    if (!optionsByPollId.has(pollId)) {
      optionsByPollId.set(pollId, []);
    }
    optionsByPollId.get(pollId).push(option);
  });

  const userVotesByPollId = new Map();
  if (userId) {
    const votes = await PollVote.find({ pollId: { $in: pollIds }, userId }).lean();
    votes.forEach(vote => {
      const pollId = vote.pollId.toString();
      if (!userVotesByPollId.has(pollId)) {
        userVotesByPollId.set(pollId, []);
      }
      userVotesByPollId.get(pollId).push(vote.optionId.toString());
    });
  }

  const pollDataByPostId = new Map();
  polls.forEach(poll => {
    const pollId = poll._id.toString();
    const pollOptions = optionsByPollId.get(pollId) || [];
    const userVotes = userVotesByPollId.get(pollId) || [];
    const optionsData = pollOptions.map(option => {
      const percentage = poll.totalVotes > 0
        ? parseFloat(((option.voteCount / poll.totalVotes) * 100).toFixed(2))
        : 0;
      const optionId = option._id.toString();
      return {
        id: optionId,
        text: option.text,
        voteCount: option.voteCount,
        percentage,
        isVoted: userVotes.includes(optionId)
      };
    });

    const isEnded = poll.endTime && new Date(poll.endTime) < new Date();

    pollDataByPostId.set(poll.postId.toString(), {
      pollId,
      topic: poll.topic,
      allowMultiple: poll.allowMultiple,
      totalVotes: poll.totalVotes,
      options: optionsData,
      userVoted: userVotes.length > 0,
      userVotes,
      endTime: poll.endTime,
      isEnded
    });
  });

  return pollDataByPostId;
};

// 获取帖子列表
exports.getPosts = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      category = 'all',
      sortBy = 'latest'
    } = req.query;

    const isHotCategory = category === 'hot';

    let pageNum = parseInt(page);
    let limit = Math.min(parseInt(pageSize), 100);
    let skip = (pageNum - 1) * limit;

    // category=hot：固定返回热榜前10，不走分页参数
    if (isHotCategory) {
      pageNum = 1;
      limit = 10;
      skip = 0;
    }

    // 构建查询条件
    const query = { status: 'normal' };

    if (category !== 'all' && category !== 'hot') {
      query.topic = category; // 使用 topic.id 进行过滤
    }
    if (isHotCategory) {
      // 热榜只取最近5天发布的帖子（与 hotScore 计算窗口一致）
      query.createdAt = { $gte: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) };
    }

    // 增加institution过滤：仅当user.institution和post的发布者institution相同或post.syncToUni = True时，返回结果
    if (req.user && req.user.institution) {
      query.$or = [
        { institution: req.user.institution },
        { syncToUni: true }
      ];
    }

    // 构建排序条件
    let sort = {};
    if (isHotCategory) {
      // 热榜：按预计算的 hotScore 排序
      sort = { hotScore: -1, createdAt: -1 };
    } else {
      // 最新排序（sortBy 仅保留 latest）
      sort = { createdAt: -1 };
    }

    // 查询帖子
    const posts = await Post.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username nickname avatar');

    const total = await Post.countDocuments(query);

    // 获取所有话题信息，构建 topic id -> topic 对象的映射
    const topicIds = [...new Set(posts.map(p => p.topic))];
    const topics = await Topic.find({ id: { $in: topicIds } }).lean();
    const topicMap = new Map();
    topics.forEach(topic => {
      topicMap.set(topic.id, {
        id: topic.id,
        label: topic.label,
        icon: topic.icon
      });
    });

    // 获取当前用户的点赞和收藏状态
    let userLikes = [];
    let userFavorites = [];
    if (req.user) {
      const postIds = posts.map(p => p._id);
      userLikes = await PostLike.find({
        userId: req.user.userId,
        postId: { $in: postIds }
      });
      userFavorites = await Favorite.find({
        userId: req.user.userId,
        postId: { $in: postIds }
      });
    }

    const likedPostIds = new Set(userLikes.map(l => l.postId.toString()));
    const favoritedPostIds = new Set(userFavorites.map(f => f.postId.toString()));

    const pollDataByPostId = await buildPollDataByPostId(
      posts,
      req.user ? req.user.userId : null
    );

    // 格式化返回数据
    const list = posts.map(post => {
      const postId = post._id.toString();
      const author = post.isAnonymous ? {
        userId: post.userId._id.toString(),
        nickname: generateAnonymousName(post._id, post.userId._id),
        avatar: ''
      } : {
        userId: post.userId._id.toString(),
        nickname: post.userId.nickname,
        avatar: post.userId.avatar
      };

      return {
        id: postId,
        postNum: post.postNum,
        content: post.content,
        topic: topicMap.get(post.topic) || { id: post.topic, label: post.topic, icon: '' },
        image: post.images.length > 0 ? post.images[0] : null,
        images: post.images,
        createdAt: post.createdAt.toISOString(),
        likes: post.likeCount,
        favorites: post.favoriteCount,
        comments: post.commentCount,
        hotScore: post.hotScore,
        isLiked: likedPostIds.has(postId),
        isFavorited: favoritedPostIds.has(postId),
        isAnonymous: post.isAnonymous,
        syncToUni: post.syncToUni,
        institution: post.institution,
        hasPoll: post.hasPoll,
        author,
        poll: post.hasPoll ? (pollDataByPostId.get(postId) || null) : null
      };
    });

    res.status(200).json({
      code: 200,
      message: '获取成功',
      data: {
        list,
        total,
        page: pageNum,
        pageSize: limit,
        hasMore: isHotCategory ? false : (skip + posts.length < total)
      }
    });
  } catch (error) {
    console.error('获取帖子列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 获取帖子详情
exports.getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    // 构建查询条件
    const query = {
      _id: postId,
      status: 'normal'
    };

    // 增加institution过滤：仅当user.institution和post的发布者institution相同或post.syncToUni = True时，返回结果
    if (req.user && req.user.institution) {
      query.$or = [
        { institution: req.user.institution },
        { syncToUni: true }
      ];
    }

    const post = await Post.findOne(query).populate('userId', 'username nickname avatar');

    if (!post) {
      return res.status(404).json({
        code: 404,
        message: '帖子不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 增加浏览数
    post.viewCount += 1;
    await post.save();

    // 获取话题完整信息
    const topicInfo = await Topic.findOne({ id: post.topic }).lean();
    const topicData = topicInfo ? {
      id: topicInfo.id,
      label: topicInfo.label,
      icon: topicInfo.icon
    } : {
      id: post.topic,
      label: post.topic,
      icon: ''
    };

    // 获取用户的点赞和收藏状态
    let isLiked = false;
    let isFavorited = false;
    let isAuthor = false;

    if (req.user) {
      const like = await PostLike.findOne({
        userId: req.user.userId,
        postId: post._id
      });
      const favorite = await Favorite.findOne({
        userId: req.user.userId,
        postId: post._id
      });
      isLiked = !!like;
      isFavorited = !!favorite;
      isAuthor = post.userId._id.toString() === req.user.userId;
    }

    const pollDataByPostId = await buildPollDataByPostId(
      [post],
      req.user ? req.user.userId : null
    );

    // 格式化作者信息
    const author = post.isAnonymous ? {
      userId: post.userId._id.toString(),
      nickname: generateAnonymousName(post._id, post.userId._id),
      avatar: '',
      isAuthor
    } : {
      userId: post.userId._id.toString(),
      nickname: post.userId.nickname,
      avatar: post.userId.avatar,
      isAuthor
    };

    res.status(200).json({
      code: 200,
      message: '获取成功',
      data: {
        id: post._id.toString(),
        postNum: post.postNum,
        content: post.content,
        topic: topicData,
        images: post.images,
        createdAt: post.createdAt.toISOString(),
        likes: post.likeCount,
        favorites: post.favoriteCount,
        comments: post.commentCount,
        views: post.viewCount,
        hotScore: post.hotScore,
        isLiked,
        isFavorited,
        isAnonymous: post.isAnonymous,
        syncToUni: post.syncToUni,
        institution: post.institution,
        hasPoll: post.hasPoll,
        author,
        poll: post.hasPoll ? (pollDataByPostId.get(post._id.toString()) || null) : null
      }
    });
  } catch (error) {
    console.error('获取帖子详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 发布帖子
exports.createPost = async (req, res) => {
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

    const { content, topic, isAnonymous, syncToUni, poll, images } = req.body;

    // 验证话题是否存在且启用（使用 topic.id 进行验证）
    const validTopic = await Topic.findOne({ id: topic, isActive: true });
    if (!validTopic) {
      return res.status(400).json({
        code: 400,
        message: '所选话题不存在或已禁用',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    let pollData = poll;
    if (typeof poll === 'string' && poll.trim()) {
      try {
        pollData = JSON.parse(poll);
      } catch (parseError) {
        return res.status(400).json({
          code: 400,
          message: '参数错误：poll格式不正确',
          data: null,
          timestamp: new Date().toISOString()
        });
      }
    }

    const normalizeBoolean = value => {
      if (value === true || value === 'true') return true;
      if (value === false || value === 'false') return false;
      return value;
    };

    const normalizedIsAnonymous = normalizeBoolean(isAnonymous);
    const normalizedSyncToUni = normalizeBoolean(syncToUni);
    const hasPoll = !!(pollData && pollData.topic && pollData.options && pollData.options.length > 0);

    let finalImages = [];
    // const baseUrl = process.env.CDN_URL || `http://localhost:${process.env.PORT || 3000}`;
    const baseUrl = process.env.CDN_URL || `https://gplkyyqadzzu.sealosgzg.site`;
    const uploadRoot = path.resolve(process.env.UPLOAD_DIR || 'uploads');

    if (req.files && req.files.length > 0) {
      finalImages = req.files.map(file => {
        if (file.path) {
          const relativePath = path
            .relative(uploadRoot, path.resolve(file.path))
            .replace(/\\/g, '/');
          return `${baseUrl}/uploads/${relativePath}`;
        }
        return `${baseUrl}/uploads/${file.filename}`;
      });
    } else if (images) {
      if (Array.isArray(images)) {
        finalImages = images;
      } else if (typeof images === 'string' && images.trim()) {
        try {
          const parsedImages = JSON.parse(images);
          finalImages = Array.isArray(parsedImages) ? parsedImages : [images];
        } catch (parseError) {
          finalImages = [images];
        }
      }
    }

    if (finalImages.length > 9) {
      return res.status(400).json({
        code: 400,
        message: '最多上传9张图片',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 创建帖子
    const post = new Post({
      userId: req.user.userId,
      content,
      topic, // 存储话题的 id（如 'technology', 'life' 等）
      images: finalImages,
      isAnonymous: normalizedIsAnonymous,
      syncToUni: normalizedSyncToUni,
      hasPoll,
      institution: req.user.institution // 从用户信息中获取institution
    });

    await post.save();

    // 如果有投票信息，创建投票
    if (hasPoll) {
      const newPoll = new Poll({
        postId: post._id,
        topic: pollData.topic,
        allowMultiple: pollData.allowMultiple || false
      });
      await newPoll.save();

      // 创建投票选项
      const pollOptions = pollData.options.map((optionText, index) => ({
        pollId: newPoll._id,
        text: optionText,
        sortOrder: index
      }));
      await PollOption.insertMany(pollOptions);
    }

    // 更新用户发帖数
    await User.findByIdAndUpdate(req.user.userId, { $inc: { postCount: 1 } });

    res.status(200).json({
      code: 200,
      message: '发布成功',
      data: {
        postNum: post.postNum,
        id: post._id.toString(),
        createdAt: post.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('发布帖子错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 删除帖子
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findOne({ 
      _id: postId, 
      status: 'normal' 
    });

    if (!post) {
      return res.status(404).json({
        code: 404,
        message: '帖子不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 检查是否是作者本人
    if (post.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        code: 403,
        message: '无权限删除此帖子',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 软删除
    post.status = 'deleted';
    await post.save();

    // 更新用户发帖数
    await User.findByIdAndUpdate(req.user.userId, { $inc: { postCount: -1 } });

    res.status(200).json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除帖子错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 搜索帖子
exports.searchPosts = async (req, res) => {
  try {
    const { 
      keyword,
      startTime,
      endTime,
      page = 1, 
      pageSize = 20,
      sortBy = 'latest',
      institution = 'all'
    } = req.query;

    // 验证关键字
    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({
        code: 400,
        message: '搜索关键字不能为空',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const pageNum = parseInt(page);
    const limit = Math.min(parseInt(pageSize), 100);
    const skip = (pageNum - 1) * limit;
    const mongoose = require('mongoose');
    const trimmedKeyword = keyword.trim();
    const normalizedSortBy = String(sortBy || 'latest').toLowerCase();
    const sortMode = normalizedSortBy === 'relevance' ? 'relevance' : 'latest';

    // 构建基础查询条件（institution过滤）
    const baseQuery = { status: 'normal' };
    if (req.user && req.user.institution) {
      if (institution === 'userInstitution') {
        // 只过滤与user同institution的帖子
        baseQuery.institution = req.user.institution;
      } else {
        // 默认'all'：过滤与user同institution或syncToUni=true的帖子
        baseQuery.$or = [
          { institution: req.user.institution },
          { syncToUni: true }
        ];
      }
    }

    // 时间范围过滤
    if (startTime || endTime) {
      baseQuery.createdAt = {};
      if (startTime) {
        baseQuery.createdAt.$gte = new Date(startTime);
      }
      if (endTime) {
        baseQuery.createdAt.$lte = new Date(endTime);
      }
    }

    // C 路：如果搜索语句为 '#'+纯数字或纯数字，则精确匹配 post.postNum 并直接返回
    const idMatch = trimmedKeyword.match(/^#(\d+)$/);
    const numericMatch = trimmedKeyword.match(/^\d+$/);
    if (idMatch || numericMatch) {
      const postNumValue = parseInt(idMatch ? idMatch[1] : trimmedKeyword, 10);
      const direct = await Post.find({ ...baseQuery, postNum: postNumValue })
        .sort({ createdAt: -1 })
        .limit(1)
        .populate('userId', 'username nickname avatar');

      const posts = direct;
      const total = posts.length;

      // 获取当前用户的点赞和收藏状态
      let userLikes = [];
      let userFavorites = [];
      if (req.user && posts.length) {
        const postIds = posts.map(p => p._id);
        userLikes = await PostLike.find({
          userId: req.user.userId,
          postId: { $in: postIds }
        });
        userFavorites = await Favorite.find({
          userId: req.user.userId,
          postId: { $in: postIds }
        });
      }

      const likedPostIds = new Set(userLikes.map(l => l.postId.toString()));
      const favoritedPostIds = new Set(userFavorites.map(f => f.postId.toString()));

      // 获取话题信息
      const topicIds = [...new Set(posts.map(p => p.topic))];
      const topics = await Topic.find({ id: { $in: topicIds } }).lean();
      const topicMap = new Map();
      topics.forEach(topic => {
        topicMap.set(topic.id, {
          id: topic.id,
          label: topic.label,
          icon: topic.icon
        });
      });

      const list = posts.map(post => {
        const pid = post._id.toString();
        const author = post.isAnonymous ? {
          userId: post.userId._id.toString(),
          nickname: generateAnonymousName(post._id, post.userId._id),
          avatar: ''
        } : {
          userId: post.userId._id.toString(),
          nickname: post.userId.nickname,
          avatar: post.userId.avatar
        };

        return {
          id: pid,
          postNum: post.postNum,
          content: post.content,
          topic: topicMap.get(post.topic) || { id: post.topic, label: post.topic, icon: '' },
          image: post.images.length > 0 ? post.images[0] : null,
          images: post.images,
          createdAt: post.createdAt.toISOString(),
          likes: post.likeCount,
          favorites: post.favoriteCount,
          comments: post.commentCount,
          hotScore: post.hotScore,
          isLiked: likedPostIds.has(pid),
          isFavorited: favoritedPostIds.has(pid),
          isAnonymous: post.isAnonymous,
          syncToUni: post.syncToUni,
          institution: post.institution,
          author,
          poll: null
        };
      });

      return res.status(200).json({
        code: 200,
        message: '搜索成功',
        data: {
          list,
          total,
          page: 1,
          pageSize: 1,
          hasMore: false
        }
      });
    }

    // A/B 路：并行查询 posts($text) 与 comments($regex)
    // A 路：去 posts 表，用 $text 找帖子（返回 _id + textScore）
    const textQuery = {
      ...baseQuery,
      $text: { $search: trimmedKeyword }
    };

    // B 路：去 comments 表，用 $regex 找评论，提取对应的 postId
    const commentQuery = {
      status: 'normal',
      content: { $regex: trimmedKeyword, $options: 'i' }
    };
    
    // 如果指定了时间范围，也需要应用到评论的创建时间
    if (startTime || endTime) {
      commentQuery.createdAt = {};
      if (startTime) {
        commentQuery.createdAt.$gte = new Date(startTime);
      }
      if (endTime) {
        commentQuery.createdAt.$lte = new Date(endTime);
      }
    }

    const [postsByText, comments] = await Promise.all([
      Post.find(textQuery, { score: { $meta: 'textScore' } })
        .select('_id score createdAt')
        .sort({ score: { $meta: 'textScore' } })
        .limit(500)
        .lean(),
      Comment.find(commentQuery).select('postId').limit(2000).lean()
    ]);

    // 如果 $text 没有返回任何结果，使用 $regex 作为兜底，避免漏召回
    let postsByRegex = [];
    if (postsByText.length === 0) {
      postsByRegex = await Post.find({
        ...baseQuery,
        content: { $regex: trimmedKeyword, $options: 'i' }
      })
        .select('_id')
        .limit(500)
        .lean();
    }

    // ID 聚合与去重 + 相关度分数聚合
    const matchedPostIds = new Set();
    const scoreByPostId = new Map();

    // 命中帖子内容：使用 MongoDB 返回的 textScore
    postsByText.forEach(p => {
      const id = String(p._id);
      matchedPostIds.add(id);
      const s = typeof p.score === 'number' ? p.score : 0;
      scoreByPostId.set(id, s);
    });

    // 命中评论内容：人为给一个固定低分 1.0
    comments.forEach(c => {
      const id = String(c.postId);
      matchedPostIds.add(id);
      const prev = scoreByPostId.get(id) || 0;
      scoreByPostId.set(id, Math.max(prev, 1.0));
    });

    // 命中帖子内容（regex 兜底）：人为给一个固定低分 1.0
    postsByRegex.forEach(p => {
      const id = String(p._id);
      matchedPostIds.add(id);
      const prev = scoreByPostId.get(id) || 0;
      scoreByPostId.set(id, Math.max(prev, 1.0));
    });

    // 如果没有匹配的结果
    if (matchedPostIds.size === 0) {
      return res.status(200).json({
        code: 200,
        message: '搜索成功',
        data: {
          list: [],
          total: 0,
          page: pageNum,
          pageSize: limit,
          hasMore: false
        }
      });
    }

    // 查询匹配的帖子
    const postIdsArray = Array.from(matchedPostIds).map(id => new mongoose.Types.ObjectId(id));
    let postsQuery = Post.find({
      ...baseQuery,
      _id: { $in: postIdsArray }
    }).populate('userId', 'username nickname avatar');

    // latest：直接按新旧排序并分页（DB内排序）
    if (sortMode === 'latest') {
      postsQuery = postsQuery.sort({ createdAt: -1 }).skip(skip).limit(limit);
    } else {
      // relevance：先取出所有候选（已限流 A/B 路），在内存中按 score 排序再分页
      postsQuery = postsQuery.sort({ createdAt: -1 });
    }

    const posts = await postsQuery;
    const total = await Post.countDocuments({ ...baseQuery, _id: { $in: postIdsArray } });

    let finalPosts = posts;
    if (sortMode === 'relevance') {
      finalPosts = posts
        .slice()
        .sort((a, b) => {
          const aId = a._id.toString();
          const bId = b._id.toString();
          const aScore = scoreByPostId.get(aId) || 0;
          const bScore = scoreByPostId.get(bId) || 0;
          if (bScore !== aScore) return bScore - aScore;
          return b.createdAt.getTime() - a.createdAt.getTime();
        })
        .slice(skip, skip + limit);
    }

    // 获取当前用户的点赞和收藏状态
    let userLikes = [];
    let userFavorites = [];
    if (req.user) {
      const postIds = finalPosts.map(p => p._id);
      userLikes = await PostLike.find({ 
        userId: req.user.userId, 
        postId: { $in: postIds } 
      });
      userFavorites = await Favorite.find({ 
        userId: req.user.userId, 
        postId: { $in: postIds } 
      });
    }

    const likedPostIds = new Set(userLikes.map(l => l.postId.toString()));
    const favoritedPostIds = new Set(userFavorites.map(f => f.postId.toString()));

    // 获取话题信息
    const topicIds = [...new Set(finalPosts.map(p => p.topic))];
    const topics = await Topic.find({ id: { $in: topicIds } }).lean();
    const topicMap = new Map();
    topics.forEach(topic => {
      topicMap.set(topic.id, {
        id: topic.id,
        label: topic.label,
        icon: topic.icon
      });
    });

    // 格式化返回数据
    const list = finalPosts.map(post => {
      const postId = post._id.toString();
      const author = post.isAnonymous ? {
        userId: post.userId._id.toString(),
        nickname: generateAnonymousName(post._id, post.userId._id),
        avatar: ''
      } : {
        userId: post.userId._id.toString(),
        nickname: post.userId.nickname,
        avatar: post.userId.avatar
      };

      return {
        id: postId,
        postNum: post.postNum,
        content: post.content,
        topic: topicMap.get(post.topic) || { id: post.topic, label: post.topic, icon: '' },
        image: post.images.length > 0 ? post.images[0] : null,
        images: post.images,
        createdAt: post.createdAt.toISOString(),
        likes: post.likeCount,
        favorites: post.favoriteCount,
        comments: post.commentCount,
        hotScore: post.hotScore,
        isLiked: likedPostIds.has(postId),
        isFavorited: favoritedPostIds.has(postId),
        isAnonymous: post.isAnonymous,
        syncToUni: post.syncToUni,
        institution: post.institution,
        author,
        poll: null
      };
    });

    res.status(200).json({
      code: 200,
      message: '搜索成功',
      data: {
        list,
        total,
        page: pageNum,
        pageSize: limit,
        hasMore: skip + finalPosts.length < total
      }
    });
  } catch (error) {
    console.error('搜索帖子错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

