# 话题系统重构说明 - ID与Label分离

## 📋 重构概述

为了更好地支持国际化和数据一致性，我们对话题（Topic）系统进行了重构，将**标识符（id）**和**显示名称（label）**进行了分离。

**重构日期：** 2026-03-23
**影响范围：** 话题相关接口、帖子相关接口
**向后兼容：** ⚠️ 不兼容，需要前端同步修改

---

## 🔄 核心变化

### 变化前
```javascript
// 话题数据
{
  "id": "随写",      // id 和 label 相同
  "label": "随写"
}

// 发帖时传递
POST /api/posts
{
  "topic": "随写"    // 直接使用中文
}

// 帖子数据中存储
{
  "topic": "随写"    // 数据库存储中文
}
```

### 变化后
```javascript
// 话题数据
{
  "id": "casual",    // id 使用英文标识符
  "label": "随写"     // label 用于显示
}

// 发帖时传递
POST /api/posts
{
  "topic": "casual"  // ⚠️ 必须使用 id，而非 label
}

// 帖子数据中存储
{
  "topic": "casual"  // 数据库存储英文 id
}
```

---

## 📌 前端适配要点

### 1. 获取话题列表时

**接口：** `GET /api/topics`

**响应示例：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "categories": [
      {
        "id": "all",
        "label": "全部",
        "order": 0,
        "icon": "",
        "showForCreate": false
      },
      {
        "id": "hot",
        "label": "热榜",
        "order": 1,
        "icon": "fire",
        "showForCreate": false
      },
      {
        "id": "casual",
        "label": "随写",
        "order": 2,
        "icon": "",
        "showForCreate": true
      },
      {
        "id": "emotion",
        "label": "情感",
        "order": 3,
        "icon": "",
        "showForCreate": true
      },
      {
        "id": "study",
        "label": "学业",
        "order": 4,
        "icon": "",
        "showForCreate": true
      },
      {
        "id": "job",
        "label": "求职",
        "order": 5,
        "icon": "",
        "showForCreate": true
      },
      {
        "id": "trade",
        "label": "交易",
        "order": 6,
        "icon": "",
        "showForCreate": true
      },
      {
        "id": "food",
        "label": "美食",
        "order": 7,
        "icon": "",
        "showForCreate": true
      }
    ]
  }
}
```

**前端处理：**
```javascript
// ✅ 正确：使用 label 展示给用户
categories.forEach(category => {
  console.log(category.label);  // "随写", "情感", "学业"...
});

// ✅ 正确：使用 id 进行数据传输
const selectedTopicId = category.id;  // "casual", "emotion", "study"...
```

---

### 2. 发帖时

**接口：** `POST /api/posts`

**请求参数变化：**
```javascript
// ❌ 错误：使用 label
{
  "content": "这是一篇帖子",
  "topic": "随写",  // ❌ 错误！
  "isAnonymous": false,
  "syncToUni": false
}

// ✅ 正确：使用 id
{
  "content": "这是一篇帖子",
  "topic": "casual",  // ✅ 正确！
  "isAnonymous": false,
  "syncToUni": false
}
```

**前端代码示例：**
```javascript
// 假设用户选择了话题
const selectedCategory = {
  id: "casual",
  label: "随写"
};

// ✅ 正确：发帖时使用 id
const postData = {
  content: "帖子内容",
  topic: selectedCategory.id,  // 使用 id，而非 label
  isAnonymous: false,
  syncToUni: false
};

await fetch('/api/posts', {
  method: 'POST',
  body: JSON.stringify(postData)
});
```

---

### 3. 筛选帖子时

**接口：** `GET /api/posts`

**请求参数变化：**
```javascript
// ❌ 错误：使用 label
GET /api/posts?category=随写

// ✅ 正确：使用 id
GET /api/posts?category=casual
```

**前端代码示例：**
```javascript
// 假设用户点击了"随写"分类
const selectedCategory = {
  id: "casual",
  label: "随写"
};

// ✅ 正确：使用 id 作为 category 参数
const response = await fetch(`/api/posts?category=${selectedCategory.id}`);
```

---

### 4. 显示帖子数据时

**接口：** `GET /api/posts` 或 `GET /api/posts/:postId`

**响应中的 topic 字段：**
```json
{
  "id": "69737a1e2cb37668a019b18b",
  "content": "帖子内容",
  "topic": "casual",  // ⚠️ 现在返回的是 id，而非 label
  "createdAt": "2026-01-21T10:15:00Z",
  ...
}
```

**前端处理方案：**

#### 方案1：建立映射表（推荐）
```javascript
// 1. 获取话题列表并建立映射
const topicsResponse = await fetch('/api/topics');
const { categories } = topicsResponse.data;

// 建立 id -> label 的映射
const topicMap = {};
categories.forEach(cat => {
  topicMap[cat.id] = cat.label;
});
// 结果: { "casual": "随写", "emotion": "情感", ... }

// 2. 显示帖子时，使用映射表转换
const posts = await fetchPosts();
posts.forEach(post => {
  const topicLabel = topicMap[post.topic] || post.topic;
  console.log(topicLabel);  // 显示 "随写" 而非 "casual"
});
```

#### 方案2：直接显示 id（不推荐）
```javascript
// 如果实在来不及改，可以先直接显示 id
// 但用户体验较差
<div>{post.topic}</div>  // 显示 "casual"
```

---

## 📋 话题 ID 对照表

| 中文名称 | 原 ID/Label | 新 ID | 新 Label |
|---------|------------|-------|---------|
| 全部 | "all" | "all" | "全部" |
| 热榜 | "hot" | "hot" | "热榜" |
| 随写 | "随写" | **"casual"** | "随写" |
| 情感 | "情感" | **"emotion"** | "情感" |
| 学业 | "学业" | **"study"** | "学业" |
| 求职 | "求职" | **"job"** | "求职" |
| 交易 | "交易" | **"trade"** | "交易" |
| 美食 | "美食" | **"food"** | "美食" |

---

## ⚠️ 重点注意事项

### 1. 所有涉及 topic 的请求参数都必须使用 id

| 场景 | 旧参数 | 新参数 | 说明 |
|-----|-------|-------|------|
| 发帖 | `topic: "随写"` | `topic: "casual"` | ⚠️ 必改 |
| 筛选 | `category: "随写"` | `category: "casual"` | ⚠️ 必改 |
| 显示 | 直接显示 topic | 需要映射后显示 | ⚠️ 必改 |

### 2. 建议的前端架构调整

```javascript
// 在应用启动时获取并缓存话题列表
class TopicService {
  constructor() {
    this.topics = [];
    this.topicMap = {};
  }

  // 初始化：获取话题列表
  async init() {
    const response = await fetch('/api/topics');
    this.topics = response.data.categories;

    // 建立 id -> topic 的映射
    this.topics.forEach(topic => {
      this.topicMap[topic.id] = topic;
    });
  }

  // 根据 id 获取 label
  getLabel(id) {
    return this.topicMap[id]?.label || id;
  }

  // 根据 id 获取完整话题对象
  getTopic(id) {
    return this.topicMap[id];
  }

  // 获取可用于发帖的话题列表
  getCreatableTopics() {
    return this.topics.filter(t => t.showForCreate);
  }
}

// 使用示例
const topicService = new TopicService();
await topicService.init();

// 显示帖子时
const topicLabel = topicService.getLabel(post.topic);  // "casual" -> "随写"
```

### 3. 向后兼容处理（可选）

如果担心旧数据问题，可以在前端做兼容处理：

```javascript
function getTopicLabel(topicId) {
  // 先查映射表
  if (topicMap[topicId]) {
    return topicMap[topicId].label;
  }

  // 如果找不到，可能是旧数据（直接存的中文）
  // 直接返回原值
  return topicId;
}

// 使用
const label = getTopicLabel(post.topic);
// "casual" -> "随写"
// "随写" -> "随写" (兼容旧数据)
```

---

## 🔍 测试检查清单

### 前端自测项
- [ ] 话题列表能正确显示（显示 label）
- [ ] 发帖时正确传递 topic id（而非 label）
- [ ] 筛选帖子时正确传递 category id
- [ ] 帖子列表中的 topic 能正确映射为 label 显示
- [ ] 帖子详情中的 topic 能正确映射为 label 显示
- [ ] 搜索结果中的 topic 能正确映射为 label 显示

### 接口测试
```bash
# 1. 获取话题列表
curl -X GET http://your-api/api/topics

# 2. 发帖（使用新的 id）
curl -X POST http://your-api/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "测试帖子",
    "topic": "casual",
    "isAnonymous": false,
    "syncToUni": false
  }'

# 3. 筛选帖子（使用新的 id）
curl -X GET http://your-api/api/posts?category=casual
```

---

## ❓ FAQ

### Q1: 为什么要做这个重构？
**A:** 将 id 和 label 分离是国际化的最佳实践：
- `id` 作为稳定的标识符，用于数据传输和存储
- `label` 作为显示名称，可以根据语言、地区灵活调整
- 例如：`id: "casual"` 可以对应中文 "随写"、英文 "Casual"、繁体 "隨寫"

### Q2: 旧的帖子数据怎么办？
**A:** 后端会进行数据迁移，将所有帖子的 topic 字段从 label（如 "随写"）更新为 id（如 "casual"）。前端无需担心数据兼容问题。

### Q3: 如果后端还没迁移完数据，前端如何兼容？
**A:** 可以使用上面提到的兼容处理方案：
```javascript
function getTopicLabel(topicId) {
  return topicMap[topicId]?.label || topicId;
}
```
这样无论返回的是 id 还是 label，都能正常显示。

### Q4: 前端需要多久完成适配？
**A:** 根据代码复杂度，预计需要：
- 简单情况（集中式状态管理）：**1-2小时**
- 复杂情况（分散的话题处理逻辑）：**半天**

### Q5: 适配过程中可以分步骤进行吗？
**A:** 建议的适配顺序：
1. **第一步（必须）**：修改发帖接口，使用 id 而非 label
2. **第二步（必须）**：修改筛选接口，使用 id 而非 label
3. **第三步（必须）**：添加话题映射逻辑，正确显示帖子的 topic
4. **第四步（优化）**：建立 TopicService，统一管理话题数据

---

## 📞 联系方式

如有疑问或需要协助，请联系：
- **后端负责人：** [你的名字]
- **API文档：** `/API_Documentation/topicController.md`
- **相关文档：** `/API_Documentation/postController.md`

---

## 📝 附录：完整的前端示例代码

```javascript
// ============= TopicService.js =============
class TopicService {
  constructor() {
    this.topics = [];
    this.topicMap = {};
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      const response = await fetch('/api/topics', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      const data = await response.json();

      if (data.code === 200) {
        this.topics = data.data.categories;
        this.topics.forEach(topic => {
          this.topicMap[topic.id] = topic;
        });
        this.initialized = true;
      }
    } catch (error) {
      console.error('Failed to load topics:', error);
    }
  }

  getLabel(id) {
    return this.topicMap[id]?.label || id;
  }

  getTopic(id) {
    return this.topicMap[id];
  }

  getCreatableTopics() {
    return this.topics.filter(t => t.showForCreate);
  }

  getAllTopics() {
    return this.topics;
  }
}

// 导出单例
export const topicService = new TopicService();

// ============= 使用示例 =============

// 1. 在应用启动时初始化
async function initApp() {
  await topicService.init();
  // ... 其他初始化逻辑
}

// 2. 在话题选择组件中
function TopicSelector() {
  const topics = topicService.getCreatableTopics();

  return (
    <select onChange={(e) => setSelectedTopicId(e.target.value)}>
      {topics.map(topic => (
        <option key={topic.id} value={topic.id}>
          {topic.label}  {/* 显示 label */}
        </option>
      ))}
    </select>
  );
}

// 3. 在发帖时
async function createPost(content, topicId, isAnonymous, syncToUni) {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      content,
      topic: topicId,  // 使用 id，不是 label
      isAnonymous,
      syncToUni
    })
  });
  return response.json();
}

// 4. 在显示帖子列表时
function PostList({ posts }) {
  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>
          <div className="topic">
            {topicService.getLabel(post.topic)}  {/* 将 id 转为 label */}
          </div>
          <div className="content">{post.content}</div>
        </div>
      ))}
    </div>
  );
}

// 5. 在筛选帖子时
async function fetchPostsByTopic(topicId) {
  const response = await fetch(`/api/posts?category=${topicId}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return response.json();
}
```

---

**重构完成日期：** 2026-03-23
**文档版本：** v1.0
**最后更新：** 2026-03-23
