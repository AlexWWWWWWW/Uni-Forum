const { validationResult } = require('express-validator');
const path = require('path');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const CommentLike = require('../models/CommentLike');
const { generateFloorNumber } = require('../utils/floorNumber');
const { generateAnonymousName } = require('../utils/anonymousName');

// 获取评论列表
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { 
      page = 1, 
      pageSize = 50, 
      sortOrder = 'asc',
      onlyAuthor = 'false'
    } = req.query;

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

    const pageNum = parseInt(page);
    const limit = Math.min(parseInt(pageSize), 100);
    const skip = (pageNum - 1) * limit;

    // 构建查询条件
    const query = { postId, status: 'normal' };
    
    // 只看楼主
    if (onlyAuthor === 'true') {
      query.userId = post.userId;
    }

    // 排序：正序或倒序
    const sort = sortOrder === 'desc' ? { createdAt: -1 } : { createdAt: 1 };

    // 查询评论
    const comments = await Comment.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username nickname avatar')
      .populate('replyToCommentId', 'content');

    const total = await Comment.countDocuments(query);

    // 获取当前用户的点赞状态
    let userLikes = [];
    if (req.user) {
      const commentIds = comments.map(c => c._id);
      userLikes = await CommentLike.find({ 
        userId: req.user.userId, 
        commentId: { $in: commentIds } 
      });
    }

    const likedCommentIds = new Set(userLikes.map(l => l.commentId.toString()));

    // 格式化返回数据
    const list = comments.map((comment, index) => {
      const commentId = comment._id.toString();
      const isAuthor = comment.userId._id.toString() === post.userId.toString();
      
      // 显示作者名称
      let authorName = comment.userId.nickname;
      if (comment.isAnonymous) {
        authorName = generateAnonymousName(post._id, comment.userId._id);
      } else if (isAuthor) {
        authorName = '洞主';
      }

      return {
        id: commentId,
        floor: comment.floor,
        content: comment.content,
        author: authorName,
        authorId: comment.userId._id.toString(),
        createdAt: comment.createdAt.toISOString(),
        isAuthor,
        isLiked: likedCommentIds.has(commentId),
        likeCount: comment.likeCount,
        replyTo: comment.replyToCommentId ? comment.replyToCommentId.content : null,
        replyToFloor: comment.replyToFloor,
        image: comment.image
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
        hasMore: skip + comments.length < total
      }
    });
  } catch (error) {
    console.error('获取评论列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 发表评论
exports.createComment = async (req, res) => {
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
    const { content, replyToCommentId, replyToFloor, isAnonymous } = req.body;

    // 图片处理：支持两种方式
    //   方式一：multipart/form-data 直接上传文件（字段名：file），由 multer 写入 req.file
    //   方式二：body 中传入已预上传的图片 URL 字符串（字段名：image）
    let imageUrl = null;
    if (req.file) {
      // 一键上传：根据 multer 保存的文件路径生成访问 URL
      const baseUrl = process.env.CDN_URL || `https://gplkyyqadzzu.sealosgzg.site`;
      const uploadRoot = path.resolve(process.env.UPLOAD_DIR || 'uploads');
      const relativePath = path
        .relative(uploadRoot, path.resolve(req.file.path))
        .replace(/\\/g, '/');
      imageUrl = `${baseUrl}/uploads/${relativePath}`;
    } else if (req.body.image) {
      // 预上传模式：直接使用传入的 URL
      imageUrl = req.body.image;
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

    // 计算楼层号
    const commentCount = await Comment.countDocuments({ postId, status: 'normal' });
    const floor = generateFloorNumber(commentCount);

    // 创建评论
    const comment = new Comment({
      postId,
      userId: req.user.userId,
      content,
      floor,
      replyToCommentId: replyToCommentId || null,
      replyToFloor: replyToFloor || null,
      image: imageUrl,
      isAnonymous
    });

    await comment.save();

    // 更新帖子的评论数
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    // 更新用户的评论数
    await User.findByIdAndUpdate(req.user.userId, { $inc: { commentCount: 1 } });

    // 获取用户信息
    const user = await User.findById(req.user.userId);
    const isPostAuthor = post.userId.toString() === req.user.userId;
    
    let authorName = user.nickname;
    if (isAnonymous) {
      authorName = generateAnonymousName(post._id, req.user.userId);
    } else if (isPostAuthor) {
      authorName = '洞主 (我)';
    } else {
      authorName = `${user.nickname} (我)`;
    }

    res.status(200).json({
      code: 200,
      message: '评论成功',
      data: {
        commentId: comment._id,
        floor: comment.floor,
        author: authorName,
        createdAt: comment.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('发表评论错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 删除评论
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findOne({ 
      _id: commentId, 
      status: 'normal' 
    });

    if (!comment) {
      return res.status(404).json({
        code: 404,
        message: '评论不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 检查是否是作者本人
    if (comment.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        code: 403,
        message: '无权限删除此评论',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 软删除
    comment.status = 'deleted';
    await comment.save();

    // 更新帖子的评论数
    await Post.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -1 } });

    // 更新用户的评论数
    await User.findByIdAndUpdate(req.user.userId, { $inc: { commentCount: -1 } });

    res.status(200).json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

