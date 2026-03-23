/**
 * 数据库迁移脚本：初始化话题数据
 *
 * 使用方法：
 * node scripts/initTopics.js
 *
 * 说明：
 * - 此脚本会初始化默认的话题分类到数据库
 * - 如果话题已存在则跳过
 * - 仅在首次部署或添加新话题时运行
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Topic = require('../src/models/Topic');

// 默认话题配置（id 使用英文，label 使用中文显示）
const defaultTopics = [
  { id: 'casual', label: '随写', order: 2, icon: '', showForCreate: true, isActive: true },
  { id: 'emotion', label: '情感', order: 3, icon: '', showForCreate: true, isActive: true },
  { id: 'study', label: '学业', order: 4, icon: '', showForCreate: true, isActive: true },
  { id: 'job', label: '求职', order: 5, icon: '', showForCreate: true, isActive: true },
  { id: 'trade', label: '交易', order: 6, icon: '', showForCreate: true, isActive: true },
  { id: 'food', label: '美食', order: 7, icon: '', showForCreate: true, isActive: true }
];

async function initTopics() {
  try {
    // 连接数据库（使用与应用相同的配置）
    const mongoURI = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;

    console.log('正在连接数据库...');
    await mongoose.connect(mongoURI, { dbName: dbName });
    console.log('✅ 数据库连接成功');
    console.log('📊 当前数据库:', mongoose.connection.db.databaseName, '\n');

    let createdCount = 0;
    let skippedCount = 0;

    // 插入话题数据
    for (const topicData of defaultTopics) {
      const existingTopic = await Topic.findOne({ id: topicData.id });

      if (existingTopic) {
        console.log(`⏭️  话题 "${topicData.label}" 已存在，跳过`);
        skippedCount++;
      } else {
        const topic = new Topic(topicData);
        await topic.save();
        console.log(`✅ 创建话题: ${topicData.label}`);
        createdCount++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 初始化完成！`);
    console.log(`   新增: ${createdCount} 个话题`);
    console.log(`   跳过: ${skippedCount} 个话题`);
    console.log(`   总计: ${defaultTopics.length} 个话题`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
}

// 运行初始化
initTopics();
