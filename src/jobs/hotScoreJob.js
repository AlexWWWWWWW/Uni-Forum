const cron = require('node-cron');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { Poll } = require('../models/Poll');

const TEN_MINUTES_CRON = '*/10 * * * *';
const LOOKBACK_DAYS = 5;

function computeHotScore({
  viewCount = 0,
  likeCount = 0,
  favoriteCount = 0,
  commentCount = 0,
  commentLikeCount = 0,
  totalVotes = 0,
  createdAt,
  now
}) {
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const hoursSinceCreated = Math.max(0, (now.getTime() - created.getTime()) / (1000 * 60 * 60));
  const denominator = Math.pow(hoursSinceCreated + 2, 1.5);

  const numerator =
    0.1 * (viewCount || 0) +
    0.5 * (likeCount || 0) +
    1 * (favoriteCount || 0) +
    5 * (commentCount || 0) +
    0.1 * (commentLikeCount || 0) +
    0.5 * (totalVotes || 0);

  const score = numerator / denominator;
  return Number.isFinite(score) ? score : 0;
}

async function updateHotScoresOnce() {
  const now = new Date();
  const since = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const posts = await Post.find({
    status: 'normal',
    createdAt: { $gte: since }
  })
    .select('_id createdAt viewCount likeCount favoriteCount commentCount')
    .lean();

  if (!posts.length) return { scanned: 0, updated: 0 };

  const postIds = posts.map(p => p._id);

  const [commentLikeAgg, polls] = await Promise.all([
    Comment.aggregate([
      { $match: { postId: { $in: postIds }, status: 'normal' } },
      { $group: { _id: '$postId', commentLikeCount: { $sum: '$likeCount' } } }
    ]),
    Poll.find({ postId: { $in: postIds }, status: { $ne: 'deleted' } })
      .select('postId totalVotes')
      .lean()
  ]);

  const commentLikeByPostId = new Map(
    commentLikeAgg.map(r => [String(r._id), r.commentLikeCount || 0])
  );
  const totalVotesByPostId = new Map(
    polls.map(p => [String(p.postId), p.totalVotes || 0])
  );

  const ops = posts.map(post => {
    const commentLikeCount = commentLikeByPostId.get(String(post._id)) || 0;
    const totalVotes = totalVotesByPostId.get(String(post._id)) || 0;
    const hotScore = computeHotScore({
      ...post,
      commentLikeCount,
      totalVotes,
      now
    });

    return {
      updateOne: {
        filter: { _id: post._id },
        update: { $set: { hotScore } }
      }
    };
  });

  const result = await Post.bulkWrite(ops, { ordered: false });
  const updated = (result && (result.modifiedCount ?? result.nModified)) || 0;

  return { scanned: posts.length, updated };
}

function startHotScoreJob() {
  let isRunning = false;

  const run = async () => {
    if (isRunning) return;
    isRunning = true;
    const startedAt = Date.now();

    try {
      const { scanned, updated } = await updateHotScoresOnce();
      const costMs = Date.now() - startedAt;
      console.log(`🔥 hotScore job done: scanned=${scanned}, updated=${updated}, cost=${costMs}ms`);
    } catch (err) {
      console.error('🔥 hotScore job failed:', err);
    } finally {
      isRunning = false;
    }
  };

  // 启动后先跑一次，再进入定时任务
  run();
  cron.schedule(TEN_MINUTES_CRON, run);

  console.log(`🔥 hotScore job scheduled: ${TEN_MINUTES_CRON} (lookback=${LOOKBACK_DAYS}d)`);
}

module.exports = { startHotScoreJob, updateHotScoresOnce, computeHotScore };


