const { validationResult } = require('express-validator');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const PostLike = require('../models/PostLike');
const CommentLike = require('../models/CommentLike');
const Favorite = require('../models/Favorite');

// 点赞/取消点赞帖子
exports.likePost = async (req, res) => {
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
    const { action } = req.body;

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

    if (action === 'like') {
      // 点赞
      try {
        await PostLike.create({
          postId,
          userId: req.user.userId
        });
        
        // 更新点赞数
        await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });

        const updatedPost = await Post.findById(postId);
        
        return res.status(200).json({
          code: 200,
          message: '点赞成功',
          data: {
            isLiked: true,
            likeCount: updatedPost.likeCount
          }
        });
      } catch (error) {
        // 重复点赞
        if (error.code === 11000) {
          return res.status(409).json({
            code: 409,
            message: '已经点赞过了',
            data: null,
            timestamp: new Date().toISOString()
          });
        }
        throw error;
      }
    } else if (action === 'unlike') {
      // 取消点赞
      const result = await PostLike.deleteOne({
        postId,
        userId: req.user.userId
      });

      if (result.deletedCount === 0) {
        return res.status(400).json({
          code: 400,
          message: '还未点赞',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      // 更新点赞数
      await Post.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } });

      const updatedPost = await Post.findById(postId);

      return res.status(200).json({
        code: 200,
        message: '取消点赞成功',
        data: {
          isLiked: false,
          likeCount: updatedPost.likeCount
        }
      });
    } else {
      return res.status(400).json({
        code: 400,
        message: 'action参数必须是like或unlike',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('点赞帖子错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 收藏/取消收藏帖子
exports.favoritePost = async (req, res) => {
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
    const { action } = req.body;

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

    if (action === 'add') {
      // 收藏
      try {
        await Favorite.create({
          postId,
          userId: req.user.userId
        });
        
        // 更新收藏数
        await Post.findByIdAndUpdate(postId, { $inc: { favoriteCount: 1 } });

        const updatedPost = await Post.findById(postId);
        
        return res.status(200).json({
          code: 200,
          message: '收藏成功',
          data: {
            isFavorited: true,
            favoriteCount: updatedPost.favoriteCount
          }
        });
      } catch (error) {
        // 重复收藏
        if (error.code === 11000) {
          return res.status(409).json({
            code: 409,
            message: '已经收藏过了',
            data: null,
            timestamp: new Date().toISOString()
          });
        }
        throw error;
      }
    } else if (action === 'remove') {
      // 取消收藏
      const result = await Favorite.deleteOne({
        postId,
        userId: req.user.userId
      });

      if (result.deletedCount === 0) {
        return res.status(400).json({
          code: 400,
          message: '还未收藏',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      // 更新收藏数
      await Post.findByIdAndUpdate(postId, { $inc: { favoriteCount: -1 } });

      const updatedPost = await Post.findById(postId);

      return res.status(200).json({
        code: 200,
        message: '取消收藏成功',
        data: {
          isFavorited: false,
          favoriteCount: updatedPost.favoriteCount
        }
      });
    } else {
      return res.status(400).json({
        code: 400,
        message: 'action参数必须是add或remove',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('收藏帖子错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 点赞/取消点赞评论
exports.likeComment = async (req, res) => {
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

    const { commentId } = req.params;
    const { action } = req.body;

    // 检查评论是否存在
    const comment = await Comment.findOne({ _id: commentId, status: 'normal' });
    if (!comment) {
      return res.status(404).json({
        code: 404,
        message: '评论不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'like') {
      // 点赞
      try {
        await CommentLike.create({
          commentId,
          userId: req.user.userId
        });
        
        // 更新点赞数
        await Comment.findByIdAndUpdate(commentId, { $inc: { likeCount: 1 } });

        const updatedComment = await Comment.findById(commentId);
        
        return res.status(200).json({
          code: 200,
          message: '点赞成功',
          data: {
            isLiked: true,
            likeCount: updatedComment.likeCount
          }
        });
      } catch (error) {
        // 重复点赞
        if (error.code === 11000) {
          return res.status(409).json({
            code: 409,
            message: '已经点赞过了',
            data: null,
            timestamp: new Date().toISOString()
          });
        }
        throw error;
      }
    } else if (action === 'unlike') {
      // 取消点赞
      const result = await CommentLike.deleteOne({
        commentId,
        userId: req.user.userId
      });

      if (result.deletedCount === 0) {
        return res.status(400).json({
          code: 400,
          message: '还未点赞',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      // 更新点赞数
      await Comment.findByIdAndUpdate(commentId, { $inc: { likeCount: -1 } });

      const updatedComment = await Comment.findById(commentId);

      return res.status(200).json({
        code: 200,
        message: '取消点赞成功',
        data: {
          isLiked: false,
          likeCount: updatedComment.likeCount
        }
      });
    } else {
      return res.status(400).json({
        code: 400,
        message: 'action参数必须是like或unlike',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('点赞评论错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 获取用户收藏列表
exports.getFavorites = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;

    const pageNum = parseInt(page);
    const limit = Math.min(parseInt(pageSize), 100);
    const skip = (pageNum - 1) * limit;

    // 查询收藏
    const favorites = await Favorite.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'postId',
        match: { status: 'normal' },
        select: 'postNum content tag images createdAt likeCount commentCount hotScore'
      });

    // 过滤掉已删除的帖子
    const validFavorites = favorites.filter(f => f.postId !== null);

    const total = await Favorite.countDocuments({ userId: req.user.userId });

    // 格式化返回数据
    const list = validFavorites.map(favorite => ({
      id: favorite.postId._id.toString(),
      postNum: favorite.postId.postNum,
      content: favorite.postId.content,
      tag: favorite.postId.tag,
      image: favorite.postId.images.length > 0 ? favorite.postId.images[0] : null,
      createdAt: favorite.postId.createdAt.toISOString(),
      likes: favorite.postId.likeCount,
      comments: favorite.postId.commentCount,
      hotScore: favorite.postId.hotScore,
      favoritedAt: favorite.createdAt.toISOString()
    }));

    res.status(200).json({
      code: 200,
      message: '获取成功',
      data: {
        list,
        total,
        page: pageNum,
        pageSize: limit
      }
    });
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

