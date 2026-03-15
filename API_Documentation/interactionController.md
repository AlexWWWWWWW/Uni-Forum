## 4. 互动模块

### 4.1 点赞帖子

**接口地址：** `POST /api/posts/:postId/like`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "action": "like"
}
```

**字段说明：**
- `action`: 必填，可选值：like(点赞)/unlike(取消点赞)

**成功响应：**
```json
{
  "code": 200,
  "message": "点赞成功",
  "data": {
    "isLiked": true,
    "likeCount": 24
  }
}
```

**失败响应：**
```json
{
  "code": 409,
  "message": "已经点赞过了",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

```json
{
  "code": 400,
  "message": "还未点赞",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

---

### 4.2 收藏帖子

**接口地址：** `POST /api/posts/:postId/favorite`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "action": "add"
}
```

**字段说明：**
- `action`: 必填，可选值：add(收藏)/remove(取消收藏)

**成功响应：**
```json
{
  "code": 200,
  "message": "收藏成功",
  "data": {
    "isFavorited": true,
    "favoriteCount": 10
  }
}
```

**失败响应：**
```json
{
  "code": 409,
  "message": "已经收藏过了",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

---

### 4.3 点赞评论

**接口地址：** `POST /api/comments/:commentId/like`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "action": "like"
}
```

**字段说明：**
- `action`: 必填，可选值：like(点赞)/unlike(取消点赞)

**成功响应：**
```json
{
  "code": 200,
  "message": "点赞成功",
  "data": {
    "isLiked": true,
    "likeCount": 6
  }
}
```

---

### 4.4 获取收藏列表

**接口地址：** `GET /api/user/favorites`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数（Query）：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页数量，默认20 |

**成功响应：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": "6975bf626c5f405403f08abd",
        "postNum": 554431,
        "content": "帖子内容",
        "tag": "学业",
        "image": "/static/test.png",
        "createdAt": "2026-01-21T10:15:00Z",
        "likes": 23,
        "comments": 5,
        "hotScore": 98.6,
        "favoritedAt": "2026-01-21T10:00:00Z"
      }
    ],
    "total": 23,
    "page": 1,
    "pageSize": 20
  }
}
```

**字段说明：**
- `id`: 帖子的MongoDB ObjectId（用于内部标识）
- `postNum`: 帖子的业务编号ID（自增数字，从1开始，用于前端显示）
- `hotScore`: 帖子热度分数（由后端任务计算）

---
