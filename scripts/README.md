# 数据库脚本说明

本目录包含数据库管理相关的脚本工具。

## 目录

1. [initTopics.js](#inittopicsjs---话题初始化脚本) - 初始化默认话题
2. [migrateTopicIds.js](#migratetopicidsjs---话题id迁移脚本) - 迁移话题ID（中文→英文）

---

## initTopics.js - 话题初始化脚本

### 用途
初始化默认的话题分类到数据库中。话题系统是论坛的核心功能，用户创建帖子时必须选择一个话题。

### 何时需要运行

#### ✅ 必须运行的场景
1. **首次部署到新环境**（开发/测试/生产）
   - 数据库为空，没有任何话题数据
   - 不运行此脚本会导致用户无法创建帖子

2. **添加新的默认话题**
   - 修改脚本中的 `defaultTopics` 数组
   - 运行脚本添加新话题（已存在的会自动跳过）

#### ❌ 不需要运行的场景
- 应用每次启动时（不是启动脚本）
- 数据库中已有话题数据且无需添加新话题

### 使用方法

```bash
# 运行初始化脚本
node scripts/initTopics.js
```

### 运行结果示例

```
正在连接数据库...
数据库连接成功
✅ 创建话题: 随写
✅ 创建话题: 情感
✅ 创建话题: 学业
✅ 创建话题: 求职
✅ 创建话题: 交易
✅ 创建话题: 美食

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 初始化完成！
   新增: 6 个话题
   跳过: 0 个话题
   总计: 6 个话题
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

数据库连接已关闭
```

### 默认创建的话题

| 话题ID | 显示名称 | 排序 | 创建时可选 |
|--------|---------|------|-----------|
| casual   | 随写    | 2    | ✅        |
| emotion  | 情感    | 3    | ✅        |
| study    | 学业    | 4    | ✅        |
| job      | 求职    | 5    | ✅        |
| trade    | 交易    | 6    | ✅        |
| food     | 美食    | 7    | ✅        |

> **注意**：
> - 话题 ID 使用英文（如 'casual'），用于 API 传输和数据存储
> - 显示名称使用中文（如 '随写'），用于前端展示
> - "全部" 和 "热榜" 是系统固定分类，不存储在数据库中

### 添加新话题

如需添加新的默认话题，编辑脚本中的 `defaultTopics` 数组：

```javascript
const defaultTopics = [
  // ... 现有话题 ...
  { id: 'technology', label: '科技', order: 8, icon: 'laptop', showForCreate: true, isActive: true }
];
```

然后重新运行脚本即可。

> **重要**：id 字段必须使用英文标识符，label 字段可以使用中文显示名称。

### 安全性

- ✅ **幂等性**：可以安全地多次运行，已存在的话题会自动跳过
- ✅ **无副作用**：不会修改或删除已存在的话题
- ✅ **环境隔离**：通过 `.env` 文件配置数据库连接，支持多环境部署

### 首次部署完整流程

```bash
# 1. 克隆代码
git clone <repository-url>
cd <project-directory>

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等

# 4. 初始化话题数据（仅首次部署）
node scripts/initTopics.js

# 5. 启动应用
npm start
```

### 故障排除

#### 错误：数据库连接失败
```bash
❌ 初始化失败: MongooseError: ...
```
**解决方案**：检查 `.env` 文件中的 `MONGODB_URI` 配置是否正确。

#### 错误：话题已存在
这不是错误，脚本会自动跳过已存在的话题并继续。

### 后续管理

初始化完成后，管理员可以通过以下 API 动态管理话题：
- `POST /api/admin/topics` - 创建新话题
- `PUT /api/admin/topics/:id` - 更新话题
- `DELETE /api/admin/topics/:id` - 禁用话题

详见 [API 文档](../API_Documentation/topicController.md)。

---

## 完整工作流程示例

### 开发环境重置流程

```bash
# 1. 备份数据（可选）
mongodump --uri="mongodb://localhost:27017/uni-forum-db" --out=./backup

# 2. 清空数据库
node scripts/clearDatabase.js

# 3. 重新初始化话题
node scripts/initTopics.js

# 4. 启动应用开始测试
npm start
```

### 新环境首次部署

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env

# 3. 初始化话题（不需要清空）
node scripts/initTopics.js

# 4. 启动应用
npm start
```

---

## migrateTopicIds.js - 话题ID迁移脚本

### 用途
将旧版本的中文话题 ID（如 "随写"）迁移到新版本的英文 ID（如 "casual"）。这是为了更好地支持国际化和数据一致性。

### 何时需要运行

#### ✅ 必须运行的场景
1. **从旧版本升级**
   - 数据库中话题使用的是中文 ID（如 "随写", "情感"）
   - 需要迁移到新的英文 ID 系统（如 "casual", "emotion"）

#### ❌ 不需要运行的场景
- 全新部署（直接使用 initTopics.js）
- 已经完成过迁移
- 数据库中已经使用英文 ID

### 使用方法

```bash
# ⚠️ 运行前请先备份数据库！
node scripts/migrateTopicIds.js
```

### 迁移映射关系

| 旧 ID (中文) | 新 ID (英文) | 显示名称 |
|-------------|-------------|---------|
| 随写 | casual | 随写 |
| 情感 | emotion | 情感 |
| 学业 | study | 学业 |
| 求职 | job | 求职 |
| 交易 | trade | 交易 |
| 美食 | food | 美食 |

### 迁移内容

脚本会自动执行以下操作：

1. **迁移 Topic 集合**
   - 将 Topic 表中的 `id` 字段从中文改为英文
   - `label` 字段保持不变（仍为中文）

2. **迁移 Post 集合**
   - 将所有帖子的 `topic` 字段从中文 ID 更新为英文 ID
   - 确保帖子与新的话题 ID 保持关联

3. **验证结果**
   - 显示迁移后的话题列表
   - 显示帖子的话题分布统计

### 运行结果示例

```
⚠️  警告: 此脚本将修改数据库数据
⚠️  建议在运行前备份数据库

正在连接数据库...
✅ 数据库连接成功

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 开始迁移话题 ID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 步骤 1/2: 迁移 Topic 集合...

✅ 迁移话题: "随写" -> "casual" (随写)
✅ 迁移话题: "情感" -> "emotion" (情感)
✅ 迁移话题: "学业" -> "study" (学业)
✅ 迁移话题: "求职" -> "job" (求职)
✅ 迁移话题: "交易" -> "trade" (交易)
✅ 迁移话题: "美食" -> "food" (美食)

📊 Topic 集合迁移完成:
   更新: 6 个
   跳过: 0 个

🔄 步骤 2/2: 迁移 Post 集合的 topic 字段...

✅ 更新帖子: "随写" -> "casual" (125 个帖子)
✅ 更新帖子: "情感" -> "emotion" (89 个帖子)
✅ 更新帖子: "学业" -> "study" (234 个帖子)

📊 Post 集合迁移完成:
   更新: 448 个帖子
   无需更新: 0 个话题

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 验证迁移结果

当前话题列表:
  - id: "casual" | label: "随写"
  - id: "emotion" | label: "情感"
  - id: "study" | label: "学业"
  - id: "job" | label: "求职"
  - id: "trade" | label: "交易"
  - id: "food" | label: "美食"

帖子 topic 分布:
  - "study": 234 个帖子
  - "casual": 125 个帖子
  - "emotion": 89 个帖子

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 迁移完成！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

数据库连接已关闭
```

### 完整迁移流程

```bash
# 1. 备份数据库（重要！）
mongodump --uri="your-mongodb-uri" --out=backup-$(date +%Y%m%d)

# 2. 运行迁移脚本
node scripts/migrateTopicIds.js

# 3. 验证迁移结果
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const Topic = require('./src/models/Topic');
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const topics = await Topic.find({}).sort({ order: 1 });
  console.log('话题列表:');
  topics.forEach(t => console.log('  id:', t.id, '| label:', t.label));
  await mongoose.connection.close();
})();
"

# 4. 重启应用
npm restart
```

### 安全性

- ⚠️ **不可逆操作**：迁移会直接修改现有数据，无法自动回滚
- ⚠️ **需要备份**：强烈建议运行前备份数据库
- ✅ **幂等性**：可以安全地多次运行，已迁移的数据会被跳过
- ✅ **事务安全**：MongoDB 操作失败会终止脚本

### 回滚方法

如果迁移后出现问题，使用备份恢复：

```bash
# 停止应用
pm2 stop app

# 恢复数据库
mongorestore --uri="your-mongodb-uri" --drop backup-20260323/

# 重启应用
pm2 start app
```

### 故障排除

#### 错误：话题已存在
```
⏭️  新 ID "casual" 已存在，删除旧记录 "随写"
```
这表示数据库中同时存在新旧两个版本的话题。脚本会自动删除旧记录，保留新记录。

#### 错误：连接超时
检查 `.env` 文件中的 `MONGODB_URI` 是否正确。

#### 部分帖子未更新
如果某些帖子的 topic 字段不在映射表中，它们不会被更新。检查脚本输出的统计信息。

---

## 完整升级指南

### 场景：从旧版本（中文ID）升级到新版本（英文ID）

```bash
# ===== 第 1 步：准备工作 =====
# 1.1 备份数据库
mongodump --uri="your-mongodb-uri" --out=backup-before-migration

# 1.2 拉取最新代码
git pull origin main

# 1.3 安装依赖
npm install

# ===== 第 2 步：数据迁移 =====
# 2.1 运行迁移脚本
node scripts/migrateTopicIds.js

# 2.2 验证迁移结果
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const Topic = require('./src/models/Topic');
const Post = require('./src/models/Post');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  // 检查话题
  const topics = await Topic.find({});
  console.log('=== 话题列表 ===');
  topics.forEach(t => console.log('  -', t.id, '→', t.label));

  // 检查帖子分布
  const stats = await Post.aggregate([
    { \$match: { status: 'normal' } },
    { \$group: { _id: '\$topic', count: { \$sum: 1 } } },
    { \$sort: { count: -1 } }
  ]);
  console.log('\n=== 帖子话题分布 ===');
  stats.forEach(s => console.log('  -', s._id, ':', s.count));

  await mongoose.connection.close();
})();
"

# ===== 第 3 步：重启应用 =====
# 3.1 重启服务
npm restart

# 3.2 测试 API
curl http://localhost:3000/api/topics

# ===== 第 4 步：通知前端 =====
# 将 API_重构说明_话题ID与Label分离.md 发送给前端团队
```

---

## 常见问题 (FAQ)

### Q1: 数据库中没有任何话题数据怎么办？

**A:** 使用 `initTopics.js` 初始化：
```bash
node scripts/initTopics.js
```

### Q2: 如何判断是否需要运行迁移脚本？

**A:** 检查话题 ID 是否为中文：
```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const Topic = require('./src/models/Topic');
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const topic = await Topic.findOne({});
  if (topic) {
    console.log('示例话题 ID:', topic.id);
    console.log(topic.id.match(/[\u4e00-\u9fa5]/) ? '需要迁移（中文ID）' : '无需迁移（英文ID）');
  } else {
    console.log('数据库中没有话题，请运行 initTopics.js');
  }
  await mongoose.connection.close();
})();
"
```

### Q3: 迁移脚本可以多次运行吗？

**A:** 可以。脚本具有幂等性，已迁移的数据会被跳过。

### Q4: 迁移失败了怎么办？

**A:** 使用备份恢复数据库，然后联系技术支持。

### Q5: 前端需要做什么修改？

**A:** 参考 [API_重构说明_话题ID与Label分离.md](../API_重构说明_话题ID与Label分离.md) 文档。

---

## 相关文档

- [话题管理 API 文档](../API_Documentation/topicController.md)
- [帖子管理 API 文档](../API_Documentation/postController.md)
- [API 重构说明](../API_重构说明_话题ID与Label分离.md)
