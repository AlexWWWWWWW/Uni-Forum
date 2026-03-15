## 3. 评论模块

### 3.1 获取评论列表

**接口地址：** `GET /api/posts/:postId/comments`

**请求参数（Query）：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页数量，默认50，最大100 |
| sortOrder | String | 否 | 排序：asc(正序)/desc(倒序) |
| onlyAuthor | Boolean | 否 | 是否只看楼主 |

**请求示例：**
```
GET /api/posts/123456/comments?page=1&pageSize=50&sortOrder=asc
```

**成功响应：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": "1",
        "floor": "G",
        "content": "评论内容",
        "author": "victor",
        "authorId": "user_23456",
        "createdAt": "2026-01-21T04:20:00Z",
        "isAuthor": false,
        "isLiked": false,
        "likeCount": 0,
        "replyTo": null,
        "replyToFloor": null,
        "image": null
      },
      {
        "id": "2",
        "floor": "LG1",
        "content": "回复内容",
        "author": "Alex",
        "authorId": "user_12345",
        "createdAt": "2026-01-21T04:25:00Z",
        "isAuthor": true,
        "isLiked": false,
        "likeCount": 2,
        "replyTo": "评论内容",
        "replyToFloor": "G",
        "image": null
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 50,
    "hasMore": false
  }
}
```

**字段说明：**
- `floor`: 楼层号（G表示一楼，LG1表示二楼，以此类推）
- `author`: 显示名称
  - 当评论为匿名时，显示一个mock的英文first name（如"Alex"、"Jordan"等），同一个post下同一个user的匿名名称保持一致
  - 当评论不为匿名且是帖子作者时，显示"洞主"
  - 当评论不为匿名且不是帖子作者时，显示用户的真实昵称
- `isAuthor`: 是否是帖子作者
- `replyTo`: 回复的评论内容
- `replyToFloor`: 回复的楼层号

---

### 3.2 发表评论

**接口地址：** `POST /api/posts/:postId/comments`

**请求头：**
```
Authorization: Bearer {token}
```

**请求方式说明：**
支持两种请求方式（`application/json` 或 `multipart/form-data`），推荐使用 `multipart/form-data` 以实现图片一键上传。

**请求参数（当使用 `multipart/form-data` 直接上传图片时）：**
- `content`: 评论内容，最多500字
- `replyToCommentId`: 回复的评论ID（可选）
- `replyToFloor`: 回复的楼层号（可选）
- `file`: 图片文件，只支持单张（可选，字段名固定为 `file`）
- `isAnonymous`: 是否匿名（true/false）

**请求参数（当使用 `application/json` 传入已有图片链接时，向下兼容）：**
```json
{
  "content": "评论内容，最多500字",
  "replyToCommentId": "2",
  "replyToFloor": "LG1",
  "image": "https://example.com/image.jpg",
  "isAnonymous": false
}
```

**字段说明：**
- `content`: 必填，评论内容
- `replyToCommentId`: 可选，回复的评论ID
- `replyToFloor`: 可选，回复的楼层号
- `file` / `image`: 可选，单张图片（如果是文件传 `file` 分块，如果是外部链接传 `image` 字段）
- `isAnonymous`: 必填，是否匿名

**注意事项：**
- 评论接口现在与发帖接口一样，原生支持一键上传图片（`file` 字段），无需优先调用 `POST /api/upload`。原有传入已上传图片URL（`image` 字段）的模式依然保留。

**成功响应：**
```json
{
  "code": 200,
  "message": "评论成功",
  "data": {
    "commentId": "16",
    "floor": "LG3",
    "author": "Alex",
    "createdAt": "2026-01-21T12:35:00Z"
  }
}
```

**字段说明：**
- `author`: 显示名称
  - 当评论为匿名时，显示一个mock的英文first name（如"Alex"、"Jordan"等），同一个post下同一个user的匿名名称保持一致，不显示"(我)"后缀
  - 当评论不为匿名且是帖子作者时，显示"洞主 (我)"
  - 当评论不为匿名且不是帖子作者时，显示"用户昵称 (我)"

**失败响应：**
```json
{
  "code": 404,
  "message": "帖子不存在",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

**说明：**
- 每分钟最多评论5次
- 楼层号自动生成

---

### 3.3 删除评论

**接口地址：** `DELETE /api/comments/:commentId`

**请求头：**
```
Authorization: Bearer {token}
```

**请求示例：**
```
DELETE /api/comments/16
```

**成功响应：**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

**失败响应：**
```json
{
  "code": 403,
  "message": "无权限删除此评论",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

---
