## 6. 话题分类模块

### 6.1 获取话题分类列表

用于 forum-index 和 post-create 页面。返回所有启用的话题分类，包括固定的"全部"和"热榜"分类。

**接口地址：** `GET /api/topics` 或 `GET /api/categories` （两者等效，推荐使用 `/api/topics`）

**请求头：**
```
Authorization: Bearer <token>
```

**成功响应：**
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

**字段说明：**
- `id`: 话题唯一标识（如 'technology', 'life'，用于API请求和数据存储）
- `label`: 话题显示名称（如 '科技', '生活'，用于前端展示）
- `order`: 排序顺序（数字越小越靠前）
- `icon`: 话题图标（可选）
- `showForCreate`: 是否在创建帖子时显示该话题选项

**重要说明：**
- 前端在发帖时应使用 `id` 字段（而非 `label`）作为 topic 参数
- 前端在显示时使用 `label` 字段展示给用户
- 帖子的 `topic` 字段存储的是话题的 `id`（如 'technology'），而不是 `label`（如 '科技'）

---

## 7. 管理员话题管理模块

### 7.1 获取所有话题（含未启用）

管理员专用接口，获取所有话题，包括已禁用的话题。

**接口地址：** `GET /api/admin/topics`

**请求头：**
```
Authorization: Bearer <token>
```

**权限要求：** 管理员

**成功响应：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "topics": [
      {
        "_id": "60d5ec49f1b2c72b8c8e4f1a",
        "id": "casual",
        "label": "随写",
        "icon": "",
        "order": 2,
        "showForCreate": true,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 7.2 创建新话题

管理员创建新的话题分类。

**接口地址：** `POST /api/admin/topics`

**请求头：**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**权限要求：** 管理员

**请求体：**
```json
{
  "id": "technology",
  "label": "科技",
  "icon": "laptop",
  "order": 8,
  "showForCreate": true
}
```

**字段说明：**
- `id` (必填): 话题唯一标识，建议使用英文小写（如 'technology', 'sports'）
- `label` (必填): 话题显示名称，可以使用中文（如 '科技', '运动'）
- `icon` (可选): 话题图标，默认为空字符串
- `order` (可选): 排序顺序，默认为 99
- `showForCreate` (可选): 是否在创建帖子时显示，默认为 true

**成功响应：**
```json
{
  "code": 201,
  "message": "话题创建成功",
  "data": {
    "topic": {
      "_id": "60d5ec49f1b2c72b8c8e4f1b",
      "id": "technology",
      "label": "科技",
      "icon": "laptop",
      "order": 8,
      "showForCreate": true,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**错误响应：**
```json
{
  "code": 400,
  "message": "id和label为必填字段",
  "data": null
}
```

```json
{
  "code": 400,
  "message": "话题ID已存在",
  "data": null
}
```

---

### 7.3 更新话题

管理员更新现有话题的信息。

**接口地址：** `PUT /api/admin/topics/:id`

**请求头：**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**权限要求：** 管理员

**路径参数：**
- `id`: 话题的唯一标识（如：'casual', 'emotion'）

**请求体：**
```json
{
  "label": "随写笔记",
  "icon": "edit",
  "order": 10,
  "showForCreate": true,
  "isActive": true
}
```

**字段说明：**（所有字段均可选，仅更新提供的字段）
- `label`: 话题显示名称
- `icon`: 话题图标
- `order`: 排序顺序
- `showForCreate`: 是否在创建帖子时显示
- `isActive`: 是否启用（true: 启用, false: 禁用）

**成功响应：**
```json
{
  "code": 200,
  "message": "话题更新成功",
  "data": {
    "topic": {
      "_id": "60d5ec49f1b2c72b8c8e4f1a",
      "id": "casual",
      "label": "随写笔记",
      "icon": "edit",
      "order": 10,
      "showForCreate": true,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  }
}
```

**错误响应：**
```json
{
  "code": 404,
  "message": "话题不存在",
  "data": null
}
```

---

### 7.4 删除话题

管理员删除话题（软删除，设置为不活跃状态）。如果该话题下还有帖子，则无法删除。

**接口地址：** `DELETE /api/admin/topics/:id`

**请求头：**
```
Authorization: Bearer <token>
```

**权限要求：** 管理员

**路径参数：**
- `id`: 话题的唯一标识（如：'casual', 'emotion'）

**成功响应：**
```json
{
  "code": 200,
  "message": "话题已禁用",
  "data": {
    "topic": {
      "_id": "60d5ec49f1b2c72b8c8e4f1a",
      "id": "casual",
      "label": "随写",
      "icon": "",
      "order": 2,
      "showForCreate": true,
      "isActive": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  }
}
```

**错误响应：**
```json
{
  "code": 404,
  "message": "话题不存在",
  "data": null
}
```

```json
{
  "code": 400,
  "message": "该话题下还有15个帖子，无法删除",
  "data": {
    "postCount": 15
  }
}
```

---

## 8. 使用说明

### 8.1 初始化话题数据

首次部署时，需要运行迁移脚本初始化默认话题：

```bash
node scripts/initTopics.js
```

该脚本会自动创建以下默认话题：
- casual (随写)
- emotion (情感)
- study (学业)
- job (求职)
- trade (交易)
- food (美食)

### 8.2 管理话题流程

1. **添加新话题：** 使用 `POST /api/admin/topics` 创建新话题
2. **修改话题：** 使用 `PUT /api/admin/topics/:id` 更新话题信息
3. **禁用话题：** 使用 `DELETE /api/admin/topics/:id` 或 `PUT /api/admin/topics/:id` 设置 `isActive: false`
4. **重新启用：** 使用 `PUT /api/admin/topics/:id` 设置 `isActive: true`

### 8.3 注意事项

1. 话题的 `id` 字段创建后不可修改
2. 删除话题前需确保该话题下没有帖子（否则无法删除）
3. "全部" 和 "热榜" 是系统固定分类，不存储在数据库中
4. `showForCreate: false` 的话题不会在创建帖子时显示（如"全部"、"热榜"）
5. 已禁用的话题（`isActive: false`）不会在普通接口中返回

### 8.4 删除话题后的行为

**问：删除话题 "food"（美食）后，已有 topic="food" 的帖子会怎样？**

**答：已有帖子仍然可见，不受影响。**

具体行为如下：

| 操作场景 | 行为 | 说明 |
|---------|-----|------|
| **搜索帖子** | ✅ 可以搜索到 | 历史帖子仍可被搜索 |
| **"全部"分类** | ✅ 可以显示 | 在全部列表中正常显示 |
| **"美食"分类筛选** | ❌ 无法筛选 | 前端不显示该分类选项 |
| **创建新帖子** | ❌ 无法选择 | 创建时不显示该话题 |
| **帖子详情** | ✅ 正常显示 | topic 字段仍显示"food" |

**设计原理：**
- 删除话题采用**软删除**（`isActive: false`）
- 仅影响**前端话题选项列表**，不影响**已有帖子数据**
- 保证历史数据完整性和用户体验
- 新用户无法再使用该话题，但历史内容不受影响

**如需完全隐藏某话题的所有帖子：**
需要在业务层实现额外的过滤逻辑（当前系统不支持此功能）

### 8.5 与 Post 模型的关系

- Post 模型的 `topic` 字段存储的是话题的 `id` 值（如 "casual"、"emotion"，而非 "随写"、"情感"）
- 创建帖子时，系统会验证所选话题的 `id` 是否存在且启用（`isActive: true`）
- 已发布的帖子不受话题删除影响，topic 字段保持原值
- Post 模型已移除硬编码的 enum 限制，改为动态话题管理
- **重要：** 前端应使用 `id` 字段进行数据传输，使用 `label` 字段进行展示

---
