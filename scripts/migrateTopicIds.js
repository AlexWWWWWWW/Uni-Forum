/**
 * 数据迁移脚本：将话题ID从中文迁移到英文
 *
 * 使用方法：
 * node scripts/migrateTopicIds.js
 *
 * 说明：
 * - 此脚本会将话题的 id 从中文（如 "随写"）迁移到英文（如 "casual"）
 * - 同时会更新所有帖子的 topic 字段
 * - 运行前请备份数据库
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Topic = require('../src/models/Topic');
const Post = require('../src/models/Post');

// ID 映射关系
const idMapping = {
  '随写': 'casual',
  '情感': 'emotion',
  '学业': 'study',
  '求职': 'job',
  '交易': 'trade',
  '美食': 'food'
};

async function migrateTopicIds() {
  try {
    // 连接数据库（使用与应用相同的配置）
    const mongoURI = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;

    console.log('正在连接数据库...');
    await mongoose.connect(mongoURI, { dbName: dbName });
    console.log('✅ 数据库连接成功');
    console.log('📊 当前数据库:', mongoose.connection.db.databaseName, '\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 开始迁移话题 ID');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 步骤 1: 迁移 Topic 集合
    console.log('🔄 步骤 1/2: 迁移 Topic 集合...\n');

    let topicMigratedCount = 0;
    let topicSkippedCount = 0;

    for (const [oldId, newId] of Object.entries(idMapping)) {
      const oldTopic = await Topic.findOne({ id: oldId });

      if (oldTopic) {
        // 检查新 ID 是否已存在
        const existingNewTopic = await Topic.findOne({ id: newId });

        if (existingNewTopic) {
          console.log(`⏭️  新 ID "${newId}" 已存在，删除旧记录 "${oldId}"`);
          await Topic.deleteOne({ id: oldId });
          topicSkippedCount++;
        } else {
          // 更新 ID
          oldTopic.id = newId;
          await oldTopic.save();
          console.log(`✅ 迁移话题: "${oldId}" -> "${newId}" (${oldTopic.label})`);
          topicMigratedCount++;
        }
      } else {
        console.log(`⚠️  旧话题 "${oldId}" 不存在，跳过`);
        topicSkippedCount++;
      }
    }

    console.log(`\n📊 Topic 集合迁移完成:`);
    console.log(`   更新: ${topicMigratedCount} 个`);
    console.log(`   跳过: ${topicSkippedCount} 个\n`);

    // 步骤 2: 迁移 Post 集合
    console.log('🔄 步骤 2/2: 迁移 Post 集合的 topic 字段...\n');

    let postMigratedCount = 0;
    let postSkippedCount = 0;

    for (const [oldId, newId] of Object.entries(idMapping)) {
      const result = await Post.updateMany(
        { topic: oldId },
        { $set: { topic: newId } }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ 更新帖子: "${oldId}" -> "${newId}" (${result.modifiedCount} 个帖子)`);
        postMigratedCount += result.modifiedCount;
      } else {
        postSkippedCount++;
      }
    }

    console.log(`\n📊 Post 集合迁移完成:`);
    console.log(`   更新: ${postMigratedCount} 个帖子`);
    console.log(`   无需更新: ${postSkippedCount} 个话题\n`);

    // 验证结果
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 验证迁移结果\n');

    const topics = await Topic.find({ isActive: true }).sort({ order: 1 });
    console.log('当前话题列表:');
    topics.forEach(t => {
      console.log(`  - id: "${t.id}" | label: "${t.label}"`);
    });

    console.log('\n帖子 topic 分布:');
    const topicStats = await Post.aggregate([
      { $match: { status: 'normal' } },
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    topicStats.forEach(stat => {
      console.log(`  - "${stat._id}": ${stat.count} 个帖子`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 迁移完成！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    console.error('错误详情:', error.message);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
}

// 运行迁移
console.log('\n⚠️  警告: 此脚本将修改数据库数据');
console.log('⚠️  建议在运行前备份数据库\n');

migrateTopicIds();
