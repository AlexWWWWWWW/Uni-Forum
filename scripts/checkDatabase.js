/**
 * 数据库诊断脚本：检查数据在哪个数据库
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI;

    // 不指定数据库，连接到默认
    const baseURI = mongoURI.split('?')[0].replace(/\/[^\/]*$/, '');

    console.log('🔍 数据库诊断工具');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 连接到 MongoDB
    await mongoose.connect(baseURI + '/admin?authSource=admin');

    // 列出所有数据库
    const adminDb = mongoose.connection.db.admin();
    const dbList = await adminDb.listDatabases();

    console.log('📋 所有数据库:\n');
    dbList.databases.forEach(db => {
      console.log(`  • ${db.name.padEnd(20)} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

    await mongoose.connection.close();

    // 检查每个数据库的 posts 集合
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Posts 集合分布:\n');

    for (const db of dbList.databases) {
      const dbName = db.name;

      // 跳过系统数据库
      if (['admin', 'config', 'local'].includes(dbName)) continue;

      await mongoose.connect(baseURI + `/${dbName}?authSource=admin`);

      const postsCount = await mongoose.connection.db.collection('posts').countDocuments();
      const topicsCount = await mongoose.connection.db.collection('topics').countDocuments();
      const usersCount = await mongoose.connection.db.collection('users').countDocuments();

      if (postsCount > 0 || topicsCount > 0 || usersCount > 0) {
        console.log(`📂 数据库: ${dbName}`);
        console.log(`   Posts: ${postsCount}`);
        console.log(`   Topics: ${topicsCount}`);
        console.log(`   Users: ${usersCount}\n`);
      }

      await mongoose.connection.close();
    }

    // 显示配置信息
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚙️  应用配置:\n');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    console.log('DB_NAME:', process.env.DB_NAME);

    // 显示正确的连接命令
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 正确的 mongosh 连接命令:\n');
    console.log(`mongosh "mongodb://root:****@test-db-mongodb.ns-miz9aqfr.svc:27017/${process.env.DB_NAME}?authSource=admin"`);
    console.log('\n然后执行:');
    console.log('  db.posts.find()');
    console.log('  db.topics.find()');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    process.exit(0);
  }
}

checkDatabase();
