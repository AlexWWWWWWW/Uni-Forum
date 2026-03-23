# 推广管理 API 文档

## 1. 获取有效推广列表（公开接口）

获取所有未删除且未过期的推广信息，按显示顺序和创建时间排序。

**接口地址**
```
GET /api/promotions
```

**权限要求**
- 公开接口，无需认证

**请求参数**
- 无

**响应示例**

成功响应 (200)：
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "title": "推广文章标题",
      "cover": "https://example.com/cover.jpg",
      "url": "https://mp.weixin.qq.com/s/RlNWy-CzTOMDiUfQ_Wyxzw",
      "mpName": "示例公众号",
      "mpAvatar": "https://example.com/avatar.jpg",
      "sortOrder": 0
    },
    {
      "id": 2,
      "title": "另一个推广",
      "cover": "https://example.com/cover2.jpg",
      "url": "https://example.com/article",
      "mpName": "另一个公众号",
      "mpAvatar": "https://example.com/avatar2.jpg",
      "sortOrder": 5
    }
  ]
}
```

**字段说明**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Number | 顺序编号（从1开始，基于数组索引） |
| title | String | 推广标题 |
| cover | String | 封面图URL |
| url | String | 推广链接 |
| mpName | String | 公众号名称 |
| mpAvatar | String | 公众号头像图URL |
| sortOrder | Number | 显示顺序（值越小越靠前，默认0） |

**排序规则**
1. 按 `sortOrder` 升序（值小的先展示）
2. 同顺序值按 `createdAt` 降序（新创建的在前）

**错误响应**

服务器错误 (500)：
```json
{
  "code": 500,
  "message": "服务器内部错误",
  "data": null,
  "timestamp": "2026-03-23T10:00:00.000Z"
}
```

---

## 2. 创建推广（管理员）

管理员创建新的推广信息。

**接口地址**
```
POST /api/promotions
```

**权限要求**
- 需要管理员权限（admin role）
- 请求头需包含有效的 JWT token

**请求头**
```
Authorization: Bearer <token>
```

**请求体**
```json
{
  "title": "推广文章标题",
  "cover": "https://example.com/cover.jpg",
  "url": "https://mp.weixin.qq.com/s/RlNWy-CzTOMDiUfQ_Wyxzw",
  "mpName": "示例公众号",
  "mpAvatar": "https://example.com/avatar.jpg",
  "sortOrder": 0,
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String | 是 | 推广标题，最多100字 |
| cover | String | 是 | 封面图URL |
| url | String | 是 | 推广链接 |
| mpName | String | 否 | 公众号名称，默认为空 |
| mpAvatar | String | 否 | 公众号头像图URL，默认为空 |
| sortOrder | Number | 否 | 显示顺序，值越小越靠前，默认为0 |
| expiresAt | String/Date | 是 | 到期时间（ISO 8601格式） |

**响应示例**

成功响应 (201)：
```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "推广文章标题",
    "cover": "https://example.com/cover.jpg",
    "url": "https://mp.weixin.qq.com/s/RlNWy-CzTOMDiUfQ_Wyxzw",
    "mpName": "示例公众号",
    "mpAvatar": "https://example.com/avatar.jpg",
    "sortOrder": 0,
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "isDeleted": false,
    "deletedAt": null,
    "createdAt": "2026-03-23T10:00:00.000Z",
    "updatedAt": "2026-03-23T10:00:00.000Z"
  }
}
```

**错误响应**

验证失败 (400)：
```json
{
  "code": 400,
  "message": "推广标题不能为空; 到期时间不能为空",
  "data": null,
  "timestamp": "2026-03-23T10:00:00.000Z"
}
```

未登录 (401)：
```json
{
  "code": 401,
  "message": "未登录或token过期",
  "data": null,
  "timestamp": "2026-03-23T10:00:00.000Z"
}
```

权限不足 (403)：
```json
{
  "code": 403,
  "message": "权限不足，需要管理员权限",
  "data": null,
  "timestamp": "2026-03-23T10:00:00.000Z"
}
```

---

## 3. 更新推广（管理员）

管理员更新现有推广的信息。

**接口地址**
```
PUT /api/promotions/:id
```

**权限要求**
- 需要管理员权限（admin role）
- 请求头需包含有效的 JWT token

**请求头**
```
Authorization: Bearer <token>
```

**路径参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | String | 推广的 MongoDB _id |

**请求体**

可以更新任意字段，传入的字段会被更新：
```json
{
  "title": "更新后的标题",
  "sortOrder": 5,
  "expiresAt": "2027-01-01T00:00:00.000Z"
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String | 否 | 推广标题 |
| cover | String | 否 | 封面图URL |
| url | String | 否 | 推广链接 |
| mpName | String | 否 | 公众号名称 |
| mpAvatar | String | 否 | 公众号头像图URL |
| sortOrder | Number | 否 | 显示顺序，值越小越靠前 |
| expiresAt | String/Date | 否 | 到期时间 |

**响应示例**

成功响应 (200)：
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "更新后的标题",
    "cover": "https://example.com/cover.jpg",
    "url": "https://mp.weixin.qq.com/s/RlNWy-CzTOMDiUfQ_Wyxzw",
    "sortOrder": 5,
    "expiresAt": "2027-01-01T00:00:00.000Z",
    "isDeleted": false,
    "deletedAt": null,
    "createdAt": "2026-03-23T10:00:00.000Z",
    "updatedAt": "2026-03-23T10:30:00.000Z"
  }
}
```

**错误响应**

推广不存在 (404)：
```json
{
  "code": 404,
  "message": "推广不存在",
  "data": null,
  "timestamp": "2026-03-23T10:00:00.000Z"
}
```

未登录 (401)：
```json
{
  "code": 401,
  "message": "未登录或token过期",
  "data": null,
  "timestamp": "2026-03-23T10:00:00.000Z"
}
```

权限不足 (403)：
```json
{
  "code": 403,
  "message": "权限不足，需要管理员权限",
  "data": null,
  "timestamp": "2026-03-23T10:00:00.000Z"
}
```

---

## 4. 删除推广（管理员）

管理员软删除推广（标记为已删除，不从数据库物理删除）。

**接口地址**
```
DELETE /api/promotions/:id
```

**权限要求**
- 需要管理员权限（admin role）
- 请求头需包含有效的 JWT token

**请求头**
```
Authorization: Bearer <token>
```

**路径参数**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | String | 推广的 MongoDB _id |

**请求体**
- 无

**响应示例**

成功响应 (200)：
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

**错误响应**

推广不存在 (404)：
```json
{
  "code": 404,
  "message": "推广不存在",
  "data": null,
  "timestamp": "2026-03-23T10:00:00.000Z"
}
```

未登录 (401)：
```json
{
  "code": 401,
  "message": "未登录或token过期",
  "data": null,
  "timestamp": "2026-03-23T10:00:00.000Z"
}
```

权限不足 (403)：
```json
{
  "code": 403,
  "message": "权限不足，需要管理员权限",
  "data": null,
  "timestamp": "2026-03-23T10:00:00.000Z"
}
```

---

## 5. 查看所有推广（管理员）

管理员查看所有推广，包括已删除和已过期的记录。

**接口地址**
```
GET /api/promotions/admin
```

**权限要求**
- 需要管理员权限（admin role）
- 请求头需包含有效的 JWT token

**请求头**
```
Authorization: Bearer <token>
```

**请求参数**
- 无

**响应示例**

成功响应 (200)：
```json
{
  "code": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "推广文章标题",
      "cover": "https://example.com/cover.jpg",
      "url": "https://mp.weixin.qq.com/s/RlNWy-CzTOMDiUfQ_Wyxzw",
      "sortOrder": 0,
      "expiresAt": "2026-12-31T23:59:59.000Z",
      "isDeleted": false,
      "deletedAt": null,
      "createdAt": "2026-03-23T10:00:00.000Z",
      "updatedAt": "2026-03-23T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "已过期推广",
      "cover": "https://example.com/cover2.jpg",
      "url": "https://example.com/article",
      "sortOrder": 5,
      "expiresAt": "2026-01-01T00:00:00.000Z",
      "isDeleted": true,
      "deletedAt": "2026-01-01T00:01:00.000Z",
      "createdAt": "2025-12-01T10:00:00.000Z",
      "updatedAt": "2026-01-01T00:01:00.000Z"
    }
  ]
}
```

**字段说明**
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | MongoDB 文档ID |
| title | String | 推广标题 |
| cover | String | 封面图URL |
| url | String | 推广链接 |
| mpName | String | 公众号名称 |
| mpAvatar | String | 公众号头像图URL |
| sortOrder | Number | 显示顺序（值越小越靠前） |
| expiresAt | String | 到期时间 |
| isDeleted | Boolean | 是否已软删除 |
| deletedAt | String/null | 删除时间（未删除时为null） |
| createdAt | String | 创建时间 |
| updatedAt | String | 最后更新时间 |

**排序规则**
按 `createdAt` 降序（最新的在前）

**错误响应**

未登录 (401)：
```json
{
  "code": 401,
  "message": "未登录或token过期",
  "data": null,
  "timestamp": "2026-03-23T10:00:00.000Z"
}
```

权限不足 (403)：
```json
{
  "code": 403,
  "message": "权限不足，需要管理员权限",
  "data": null,
  "timestamp": "2026-03-23T10:00:00.000Z"
}
```

---

## 自动过期机制

### 定时任务

后端运行定时任务（每分钟执行一次），自动将 `expiresAt <= 当前时间` 且 `isDeleted: false` 的推广记录软删除：

```javascript
// 定时任务逻辑
Promotion.updateMany(
  { isDeleted: false, expiresAt: { $lte: now } },
  { $set: { isDeleted: true, deletedAt: now } }
)
```

### 日志输出

当有推广被自动软删除时，会输出日志：
```
📢 promotionJob: 软删除了 2 条过期推广
```

### 双重保障

1. **定时任务自动软删除**：每分钟扫描过期记录并标记删除
2. **查询时过滤**：公开接口 `GET /api/promotions` 查询条件包含 `expiresAt: { $gt: now }`，即使定时任务延迟，也不会返回过期数据

---

## 数据模型

### Promotion Schema

```javascript
{
  title: String,          // 推广标题（必填，最多100字）
  cover: String,          // 封面图URL（必填）
  url: String,            // 推广链接（必填）
  mpName: String,         // 公众号名称（默认空字符串）
  mpAvatar: String,       // 公众号头像图URL（默认空字符串）
  sortOrder: Number,      // 显示顺序（值越小越靠前，默认0）
  expiresAt: Date,        // 到期时间（必填）
  isDeleted: Boolean,     // 是否已软删除（默认false）
  deletedAt: Date,        // 删除时间（默认null）
  createdAt: Date,        // 创建时间（自动生成）
  updatedAt: Date         // 更新时间（自动生成）
}
```

### 索引

```javascript
{ isDeleted: 1, expiresAt: 1 }  // 优化查询和定时任务性能
```

---

## 使用示例

### 前端获取推广列表

```javascript
// 小程序/前端调用示例
fetch('https://your-api.com/api/promotions')
  .then(res => res.json())
  .then(data => {
    console.log('推广列表:', data.data);
    // data.data 是数组，每项包含 id, title, cover, url, sortOrder
  });
```

### 管理员创建推广

```javascript
// 管理后台调用示例
fetch('https://your-api.com/api/promotions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: '春节活动推广',
    cover: 'https://example.com/spring-festival.jpg',
    url: 'https://mp.weixin.qq.com/s/xxxxx',
    mpName: '示例公众号',
    mpAvatar: 'https://example.com/avatar.jpg',
    sortOrder: 0,
    expiresAt: '2027-02-01T00:00:00.000Z'
  })
})
  .then(res => res.json())
  .then(data => console.log('创建结果:', data));
```

### 管理员查看所有推广

```javascript
// 查看包含已删除/过期的所有推广
fetch('https://your-api.com/api/promotions/admin', {
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
  }
})
  .then(res => res.json())
  .then(data => {
    console.log('所有推广记录:', data.data);
    // 可以在管理后台展示是否过期、是否删除等状态
  });
```

---

## 注意事项

1. **时区问题**：`expiresAt` 使用 ISO 8601 格式存储，建议统一使用 UTC 时间
2. **软删除**：删除操作不会物理删除数据，仅标记 `isDeleted: true` 和设置 `deletedAt`
3. **管理员权限**：所有管理接口需要用户 `role: 'admin'`，普通用户无法访问
4. **定时任务**：服务启动时会立即执行一次过期检查，之后每分钟执行一次
5. **ID 映射**：公开接口返回的 `id` 是基于数组索引的顺序编号，不是数据库的 `_id`
