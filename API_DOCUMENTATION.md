# Uni-Forum 后端API接口文档

**版本：** v1.0.0  
**Base URL：** 见 `.env` 文件中的 `CDN_URL` 配置  
**更新日期：** 2026-01-27

---

## 📌 通用说明

### 认证方式
**除登录相关接口外，所有接口均需要认证**，请在请求头中携带 JWT Token：
```
Authorization: Bearer {token}
```

**例外接口（无需认证）：**
- `POST /api/auth/send-code` - 发送验证码
- `POST /api/auth/login` - 验证码登录

**注意：** 其他所有API接口都需要登录后才能访问，未登录用户无法使用。

### 响应格式
所有接口统一返回以下格式：
```json
{
  "code": 200,
  "message": "success message",
  "data": {}
}
```

### 错误码说明
| 错误码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或token过期 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如重复点赞） |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 时间格式
所有时间字段统一使用 ISO 8601 格式：`2026-01-21T12:45:00Z`

---

## 1. 认证模块

### 1.1 获取可用邮箱后缀

**接口地址：** `GET /api/auth/email-suffix`

**请求参数：**
无需请求体参数

**成功响应：**
```json
{
  "code": 200,
  "message": "获取可用邮箱后缀成功",
  "data": [
    "connect.hku.hk",
    "qq.com",
    "sms.ed.ac.uk"
  ],
  "timestamp": "2026-01-21T12:45:00Z"
}
```

**无权限响应：**
```json
{
  "code": 403,
  "message": "您所在的机构目前不是合作伙伴，请联系官方人员",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

**失败响应：**
```json
{
  "code": 500,
  "message": "服务器内部错误",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

**字段说明：**
- `data`: 合作高校/合作机构允许注册的邮箱后缀字符串数组。仅允许这些后缀的邮箱注册/登录，详见`POST /api/auth/send-code`。如需新增合作机构，请联系官方人员。

**说明：**
- 该接口不需要认证，前端可在登录页展示允许的邮箱后缀列表。
- 邮箱地址需严格以返回的后缀结尾。
- 若没有自己学校/机构的后缀，说明尚未开放注册。

---


### 1.2 发送验证码

**接口地址：** `POST /api/auth/send-code`

**请求参数：**
```json
{
  "email": "test@example.com"
}
```

**成功响应：**
```json
{
  "code": 200,
  "message": "验证码已发送，请查收邮件",
  "data": {
    "email": "test@example.com",
    "expiresIn": 300
  }
}
```

**失败响应：**
```json
{
  "code": 400,
  "message": "参数错误：邮箱格式不正确",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

```json
{
  "code": 429,
  "message": "验证码发送过于频繁，请稍后再试",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

**说明：**
- 验证码有效期5分钟
- 同一邮箱1分钟内只能发送一次

---

### 1.3 验证码登录

**接口地址：** `POST /api/auth/login`

**请求参数：**
```json
{
  "email": "test@example.com",
  "code": "123456"
}
```

**成功响应：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "507f1f77bcf86cd799439011",
    "email": "test@example.com",
    "nickname": "test",
    "avatar": "https://example.com/avatar/default.jpg",
    "expiresIn": 86400
  }
}
```

**失败响应：**
```json
{
  "code": 400,
  "message": "验证码错误或已过期",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

```json
{
  "code": 403,
  "message": "账号已被禁用",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

**说明：**
- 首次登录自动创建账号
- Token有效期24小时
- 用户模型包含以下字段：
  - `role`: 权限字段，可选值：superAdmin（超级管理员）、admin（管理员）、teacher（教师）、student（学生），默认为student
  - `institution`: 学校/机构信息，必填字段，用于数据隔离

---

### 1.4 获取用户信息

**接口地址：** `GET /api/user/profile`

**请求头：**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**成功响应：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "test@example.com",
    "nickname": "测试用户",
    "avatar": "https://example.com/avatar/default.jpg",
    "postCount": 15,
    "commentCount": 48,
    "favoriteCount": 23,
    "lastLoginAt": "2026-01-21T12:45:00Z"
  }
}
```

**失败响应：**
```json
{
  "code": 401,
  "message": "未登录或token过期",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

---

### 1.5 更新用户信息

**接口地址：** `PUT /api/user/profile`

**请求头：**
```
Authorization: Bearer {token}
Content-Type: application/json 或 multipart/form-data
```

**请求参数：**
```json
{
  "nickname": "新昵称",
  "avatar": "https://example.com/avatar/new.jpg"
}
```

**成功响应：**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "test@example.com",
    "nickname": "新昵称",
    "avatar": "https://example.com/avatar/new.jpg"
  }
}
```

**失败响应：**
```json
{
  "code": 400,
  "message": "参数错误：昵称长度必须在1-50个字符之间",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

---

## 2. 帖子模块

### 2.1 获取帖子列表

**接口地址：** `GET /api/posts`

**请求参数（Query）：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页数量，默认20，最大100 |
| category | String | 否 | 分类：all/hot/随写/情感/学业/求职/交易/美食 |
| sortBy | String | 否 | 排序：latest(最新)。注：category=hot 时固定返回热榜前10 |

**请求示例：**
```
GET /api/posts?page=1&pageSize=20&category=学业&sortBy=latest
```

**成功响应：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": "69737a1e2cb37668a019b18b",
        "postNum": 554431,
        "content": "帖子内容",
        "tag": "学业",
        "image": "/static/test.png",
        "images": [],
        "createdAt": "2026-01-21T10:15:00Z",
        "likes": 23,
        "favorites": 9,
        "comments": 5,
        "hotScore": 98.6,
        "isLiked": false,
        "isFavorited": false,
        "isAnonymous": true,
        "syncToUni": false,
        "institution": "hku",
        "hasPoll": true,
        "author": {
          "userId": "user_12345",
          "nickname": "Alex",
          "avatar": ""
        },
        "poll": {
          "pollId": "poll_123",
          "topic": "你的成绩是？",
          "allowMultiple": false,
          "totalVotes": 156,
          "options": [
            {
              "id": "opt_1",
              "text": "A",
              "voteCount": 45,
              "percentage": 28.85,
              "isVoted": false
            },
            {
              "id": "opt_2",
              "text": "B",
              "voteCount": 68,
              "percentage": 43.59,
              "isVoted": true
            }
          ],
          "userVoted": true,
          "userVotes": ["opt_2"],
          "endTime": null,
          "isEnded": false
        }
      }
    ],
    "total": 156,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

**字段说明：**
- `id`: 帖子的MongoDB ObjectId（用于内部标识）
- `postNum`: 帖子的业务编号（自增数字，从1开始，用于前端显示）
- `image`: 第一张图片URL（兼容性）
- `images`: 所有图片URL数组
- `hotScore`: 帖子热度分数（由后端任务计算）
- `isLiked`: 当前用户是否已点赞
- `isFavorited`: 当前用户是否已收藏
- `syncToUni`: 是否同步到Uni（所有学校可见）
- `institution`: 帖子所属机构
- `hasPoll`: 是否包含投票
- `poll`: 当`hasPoll=true`时返回投票详情（字段同`GET /api/posts/:postId/poll`），否则为`null`
- `hasMore`: 是否还有更多数据
- `author.nickname`: 
  - 当`isAnonymous`为`true`时，显示一个mock的英文first name（如"Alex"、"Jordan"等），同一个post下同一个user的匿名名称保持一致
  - 当`isAnonymous`为`false`时，显示用户的真实昵称

**数据隔离说明：**
- 帖子列表会根据用户的`institution`字段进行过滤
- 仅返回以下帖子：
  - 发布者的`institution`与当前用户的`institution`相同的帖子
  - `syncToUni`为`true`的帖子（同步到所有Uni的帖子）

---

### 2.2 获取帖子详情

**接口地址：** `GET /api/posts/:postId`

**请求示例：**
```
GET /api/posts/69737a1e2cb37668a019b18b
```

**成功响应：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": "69737a1e2cb37668a019b18b",
    "postNum": 554431,
    "content": "帖子内容",
    "topic": "随写",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "createdAt": "2026-01-21T04:15:00Z",
    "likes": 12,
    "favorites": 5,
    "comments": 15,
    "views": 156,
    "hotScore": 98.6,
    "isLiked": false,
    "isFavorited": false,
    "isAnonymous": true,
    "syncToUni": false,
    "institution": "hku",
    "hasPoll": true,
    "author": {
      "userId": "user_12345",
      "nickname": "Alex",
      "avatar": "",
      "isAuthor": true
    },
    "poll": {
      "pollId": "poll_123",
      "topic": "你的成绩是？",
      "allowMultiple": false,
      "totalVotes": 156,
      "options": [
        {
          "id": "opt_1",
          "text": "A",
          "voteCount": 45,
          "percentage": 28.85,
          "isVoted": false
        },
        {
          "id": "opt_2",
          "text": "B",
          "voteCount": 68,
          "percentage": 43.59,
          "isVoted": true
        }
      ],
      "userVoted": true,
      "userVotes": ["opt_2"],
      "endTime": null,
      "isEnded": false
    }
  }
}
```

**字段说明：**
- `id`: 帖子的MongoDB ObjectId（用于内部标识）
- `postNum`: 帖子的业务ID（自增数字，从1开始，用于前端显示）
- `hotScore`: 帖子热度分数（由后端任务计算）
- `syncToUni`: 是否同步到Uni（所有学校可见）
- `institution`: 帖子所属机构
- `hasPoll`: 是否包含投票
- `poll`: 当`hasPoll=true`时返回投票详情（字段同`GET /api/posts/:postId/poll`），否则为`null`
- `author.nickname`: 
  - 当`isAnonymous`为`true`时，显示一个mock的英文first name（如"Alex"、"Jordan"等），同一个post下同一个user的匿名名称保持一致
  - 当`isAnonymous`为`false`时，显示用户的真实昵称

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
- 每次访问会增加浏览数（views）
- 数据隔离规则与帖子列表相同（仅返回同institution或syncToUni=true的帖子）

---

### 2.3 发布帖子

**接口地址：** `POST /api/posts`

**请求头：**
```
Authorization: Bearer {token}
```

**请求方式说明：**
支持两种请求方式（`application/json` 或 `multipart/form-data`），推荐使用 `multipart/form-data` 以实现图片一键上传。

**请求参数（multipart/form-data）：**
- `content`: 帖子内容
- `topic`: 话题分类
- `images`: 图片文件数组，最多9张（字段名固定为`images`），推荐直接在此接口上传
- `isAnonymous`: 是否匿名
- `syncToUni`: 是否同步到所有Uni
- `poll`: 可选投票信息（如需传 JSON 可用字符串）

**字段说明：**
- `topic`: 必填，可选值：随写/情感/学业/求职/交易/美食
- `images`: 可选，图片文件数组（最多9张）；数据库中存储为图片URL数组
- `isAnonymous`: 必填，是否匿名
- `syncToUni`: 必填，是否同步到所有Uni（设为true时，所有institution的用户都能看到此帖子）
- `poll`: 可选，投票信息

**注意：**
- 发帖接口支持直接上传图片，无需先调用上传接口
- 如果前端仍采用预上传，也可传 `images` 为图片 URL 数组（JSON 字符串）
- 发布帖子时，系统会自动将当前用户的`institution`字段写入帖子的`institution`字段
- 帖子会根据`institution`进行数据隔离

**成功响应：**
```json
{
  "code": 200,
  "message": "发布成功",
  "data": {
    "id": "6975bf626c5f405403f08abd",
    "postNum": "554431",
    "createdAt": "2026-01-21T12:30:00Z"
  }
}
```

**失败响应：**
```json
{
  "code": 400,
  "message": "参数错误：帖子内容不能为空",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

```json
{
  "code": 429,
  "message": "发帖/评论过于频繁，请稍后再试",
  "data": null
}
```

**说明：**
- 每分钟最多发帖5次

---

### 2.4 删除帖子

**接口地址：** `DELETE /api/posts/:postId`

**请求头：**
```
Authorization: Bearer {token}
```

**请求示例：**
```
DELETE /api/posts/123456
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
  "message": "无权限删除此帖子",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

**说明：**
- 只能删除自己的帖子

---

### 2.5 搜索帖子

**接口地址：** `GET /api/posts/search`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数（Query）：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | String | 是 | 搜索关键字 |
| startTime | String | 否 | 开始时间（ISO 8601格式，如：2026-01-21T00:00:00Z） |
| endTime | String | 否 | 结束时间（ISO 8601格式，如：2026-01-21T23:59:59Z） |
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页数量，默认20，最大100 |
| sortBy | String | 否 | 排序：latest(最新)/relevance(相关度)，默认latest |
| institution | String | 否 | 机构过滤：all(默认，过滤与user同institution或syncToUni=true的帖子)/userInstitution(只过滤与user同institution的帖子) |

**搜索策略说明：**
- 普通查询：仅搜索 `post.content`（MongoDB `$text`）和 `comment.content`（`$regex`）
- 相关度排序：帖子命中使用 MongoDB `textScore`；评论命中给固定低分（如 1.0）
- 精确查询：当 `keyword` 形如 `#123` 或纯数字时，精确匹配 `post.postNum` 并直接返回结果

**请求示例：**
```
GET /api/posts/search?keyword=测试&startTime=2026-01-21T00:00:00Z&endTime=2026-01-21T23:59:59Z&page=1&pageSize=20&sortBy=latest&institution=all
```

**成功响应：**
```json
{
  "code": 200,
  "message": "搜索成功",
  "data": {
    "list": [
      {
        "id": "69737a1e2cb37668a019b18b",
        "postNum": 554431,
        "content": "帖子内容包含测试关键字",
        "tag": "学业",
        "image": "/static/test.png",
        "images": [],
        "createdAt": "2026-01-21T10:15:00Z",
        "likes": 23,
        "favorites": 9,
        "comments": 5,
        "hotScore": 98.6,
        "isLiked": false,
        "isFavorited": false,
        "isAnonymous": true,
        "syncToUni": false,
        "institution": "hku",
        "author": {
          "userId": "user_12345",
          "nickname": "Alex",
          "avatar": ""
        },
        "poll": null
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 20,
    "hasMore": false
  }
}
```

**失败响应：**
```json
{
  "code": 400,
  "message": "搜索关键字不能为空",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

**字段说明：**
- `keyword`: 搜索关键字，支持以下范围：
  - `post.postNum`: 如果关键字是纯数字或形如`#123`，会匹配帖子的业务编号
  - `post.content`: 在帖子内容中搜索（不区分大小写）
  - `comment.content`: 在评论内容中搜索（不区分大小写），会返回包含匹配评论的帖子
- `startTime` / `endTime`: 时间范围过滤，仅返回在此时间范围内创建的内容
- `total`: 匹配的帖子总数
- `hasMore`: 是否还有更多数据
- `hotScore`: 帖子热度分数（由后端任务计算）
- `syncToUni`: 是否同步到Uni（所有学校可见）
- `institution`: 帖子所属机构

**说明：**
- 搜索会同时匹配帖子内容和评论内容，如果评论中包含关键字，对应的帖子也会被返回
- 搜索结果会根据`institution`参数和用户的`institution`字段进行过滤：
  - `institution=all`（默认）：返回与用户同institution或syncToUni=true的帖子
  - `institution=userInstitution`：仅返回与用户同institution的帖子（不包括syncToUni=true的帖子）
- 文本搜索使用正则表达式，不区分大小写

---

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

## 5. 投票模块

### 5.1 获取投票详情

**接口地址：** `GET /api/posts/:postId/poll`

**请求示例：**
```
GET /api/posts/123456/poll
```

**成功响应：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "pollId": "poll_123",
    "topic": "你的成绩是？",
    "allowMultiple": false,
    "totalVotes": 156,
    "options": [
      {
        "id": "opt_1",
        "text": "A",
        "voteCount": 45,
        "percentage": 28.85,
        "isVoted": false
      },
      {
        "id": "opt_2",
        "text": "B",
        "voteCount": 68,
        "percentage": 43.59,
        "isVoted": true
      }
    ],
    "userVoted": true,
    "userVotes": ["opt_2"],
    "endTime": null,
    "isEnded": false
  }
}
```

**失败响应：**
```json
{
  "code": 404,
  "message": "该帖子没有投票",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

---

### 5.2 提交投票 / 取消投票 / 切换选项

**接口地址：** `POST /api/posts/:postId/poll/vote`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "optionIds": ["opt_2"]
}
```

**字段说明：**
- `optionIds`: 必填，**用户期望的最终选中选项列表**（ID数组）
  - 单选传一个元素，多选可传多个元素
  - 传入空数组 `[]` 表示取消全部投票
  - 前端无需区分"新投/修改/取消"，直接传期望的最终状态即可
  - 后端会自动计算 diff，精确新增或移除对应选项的投票记录

**行为说明：**

| 场景 | 操作 | 传参示例 |
|------|------|----------|
| 首次投票（单选） | 选中 opt_1 | `{"optionIds": ["opt_1"]}` |
| 切换选项（单选） | 从 opt_1 改为 opt_2 | `{"optionIds": ["opt_2"]}` |
| 取消投票（单选/多选均适用） | 二次点击已选选项 | `{"optionIds": []}` |
| 首次投票（多选） | 选中 opt_1、opt_2 | `{"optionIds": ["opt_1", "opt_2"]}` |
| 多选追加选项 | 当前选了 opt_1，再选 opt_2 | `{"optionIds": ["opt_1", "opt_2"]}` |
| 多选取消某项 | 当前选了 opt_1、opt_2，取消 opt_2 | `{"optionIds": ["opt_1"]}` |

**成功响应（投票或切换选项）：**
```json
{
  "code": 200,
  "message": "投票成功",
  "data": {
    "pollId": "poll_123",
    "totalVotes": 157,
    "options": [
      {
        "id": "opt_1",
        "voteCount": 45,
        "percentage": 28.66
      },
      {
        "id": "opt_2",
        "voteCount": 69,
        "percentage": 43.95
      }
    ],
    "userVotes": ["opt_2"],
    "userVoted": true
  }
}
```

**成功响应（取消全部投票，传空数组）：**
```json
{
  "code": 200,
  "message": "已取消投票",
  "data": {
    "pollId": "poll_123",
    "totalVotes": 156,
    "options": [
      {
        "id": "opt_1",
        "voteCount": 45,
        "percentage": 28.85
      },
      {
        "id": "opt_2",
        "voteCount": 68,
        "percentage": 43.59
      }
    ],
    "userVotes": [],
    "userVoted": false
  }
}
```

**失败响应：**
```json
{
  "code": 400,
  "message": "该投票不允许多选",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

**响应字段说明：**
- `options`: 各选项最新的 `voteCount` 和 `percentage`
- `userVotes`: 操作后用户实际投票的选项ID列表（可直接用于更新前端状态，无需再调 GET 接口）
- `userVoted`: 操作后用户是否仍有有效投票

**说明：**
- 支持取消投票：传 `optionIds: []` 即可撤销全部投票
- 单选支持一键切换：直接传新选项，旧选项自动撤销
- 多选支持增量操作：前端维护当前选中列表，每次点击更新列表后传给接口即可
- `totalVotes` 按净变化量更新（多选时，新增/移除各选项都会影响 totalVotes）

---

## 6. 话题分类模块

### 6.1 获取分类标签。用于forum-index和post-create页面（topics和categories都使用这个API）

**接口地址：** `GET /api/categories`

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
        "id": "write",
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
        "id": "academic",
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

---

## 7. 文件上传模块

**说明：** 上传接口用于图片预上传/单独上传；如果是发帖场景，推荐直接在 `POST /api/posts` 中携带 `images` 文件，无需调用本模块。

### 7.1 上传单张图片

**接口地址：** `POST /api/upload/image`

**请求头：**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求参数：**
- `file`: 文件对象（FormData）
- `type`: 可选，用途（post/comment/avatar）

**成功响应：**
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "https://example.com/uploads/2026/01/21/image_abc123.jpg",
    "filename": "image_abc123.jpg",
    "size": 245678,
    "width": null,
    "height": null,
    "uploadedAt": "2026-01-21T12:40:00Z"
  }
}
```

**失败响应：**
```json
{
  "code": 400,
  "message": "只支持上传 jpg, png, gif, webp 格式的图片",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

```json
{
  "code": 400,
  "message": "文件大小超过限制（最大5MB）",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

**前端示例：**
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('type', 'post');

fetch('/api/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
})
```

---

### 7.2 批量上传图片

**接口地址：** `POST /api/upload/images`

**请求头：**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求参数：**
- `files`: 文件数组（FormData），最多9张
- `type`: 可选，用途（post/comment）

**成功响应：**
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "images": [
      {
        "url": "https://example.com/uploads/2026/01/21/image_abc123.jpg",
        "filename": "image_abc123.jpg",
        "size": 245678
      },
      {
        "url": "https://example.com/uploads/2026/01/21/image_def456.jpg",
        "filename": "image_def456.jpg",
        "size": 198765
      }
    ],
    "uploadedAt": "2026-01-21T12:40:00Z"
  }
}
```

**前端示例：**
```javascript
const formData = new FormData();
files.forEach(file => {
  formData.append('files', file);
});
formData.append('type', 'post');

fetch('/api/upload/images', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
})
```

---

## 8. 接口速查表

| 模块 | 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|------|
| **认证** | GET  | /api/auth/email-suffix | ❌ | 获取可用邮箱后缀（无需认证） |
| | POST | /api/auth/send-code | ❌ | 发送验证码（无需认证） |
| | POST | /api/auth/login | ❌ | 验证码登录（无需认证） |
| | GET | /api/user/profile | ✅ | 获取用户信息 |
| | PUT | /api/user/profile | ✅ | 更新用户信息 |
| **帖子** | GET | /api/posts | ✅ | 获取帖子列表 |
| | GET | /api/posts/search | ✅ | 搜索帖子 |
| | GET | /api/posts/:postId | ✅ | 获取帖子详情 |
| | POST | /api/posts | ✅ | 发布帖子 |
| | DELETE | /api/posts/:postId | ✅ | 删除帖子 |
| **评论** | GET | /api/posts/:postId/comments | ✅ | 获取评论列表 |
| | POST | /api/posts/:postId/comments | ✅ | 发表评论 |
| | DELETE | /api/comments/:commentId | ✅ | 删除评论 |
| **互动** | POST | /api/posts/:postId/like | ✅ | 点赞帖子 |
| | POST | /api/posts/:postId/favorite | ✅ | 收藏帖子 |
| | POST | /api/comments/:commentId/like | ✅ | 点赞评论 |
| | GET | /api/user/favorites | ✅ | 获取收藏列表 |
| **投票** | GET | /api/posts/:postId/poll | ✅ | 获取投票详情 |
| | POST | /api/posts/:postId/poll/vote | ✅ | 提交投票 |
| **话题** | GET | /api/topics | ✅ | 获取话题列表 |
| | GET | /api/categories | ✅ | 获取分类标签 |
| **上传** | POST | /api/upload/image | ✅ | 上传单张图片 |
| | POST | /api/upload/images | ✅ | 批量上传图片 |

**注意：** 除登录相关接口（❌）外，所有接口均需要认证（✅），未登录用户无法访问。

---

## 9. 前端集成示例

### 9.1 Axios封装

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://gplkyyqadzzu.sealosgzg.site',
  timeout: 10000
});

// 请求拦截器
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    if (error.response?.status === 401) {
      // Token过期，跳转登录
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
```

### 9.2 API调用示例

```javascript
import api from './axios';

// 发送验证码
export const sendCode = (email) => {
  return api.post('/api/auth/send-code', { email });
};

// 登录
export const login = (email, code) => {
  return api.post('/api/auth/login', { email, code });
};

// 获取帖子列表
export const getPosts = (params) => {
  return api.get('/api/posts', { params });
};

// 发布帖子
export const createPost = (data) => {
  return api.post('/api/posts', data);
};

// 点赞帖子
export const likePost = (postId, action) => {
  return api.post(`/api/posts/${postId}/like`, { action });
};

// 上传图片
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
```

### 9.3 使用示例

```javascript
// 登录流程
async function handleLogin() {
  try {
    // 1. 发送验证码
    await sendCode('test@example.com');
    alert('验证码已发送');
    
    // 2. 用户输入验证码后登录
    const res = await login('test@example.com', '123456');
    
    // 3. 保存token和用户信息
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data));
    
    // 4. 跳转首页
    window.location.href = '/home';
  } catch (error) {
    alert(error.message);
  }
}

// 获取帖子列表
async function loadPosts() {
  try {
    const res = await getPosts({
      page: 1,
      pageSize: 20,
      category: 'all',
      sortBy: 'latest'
    });
    console.log(res.data.list);
  } catch (error) {
    console.error(error);
  }
}

// 发布帖子
async function publishPost() {
  try {
    const res = await createPost({
      content: '这是我的帖子内容',
      topic: '学业',
      images: [],
      isAnonymous: false,
      syncToUni: false
    });
    alert('发布成功');
  } catch (error) {
    alert(error.message);
  }
}
```

---

## 10. 注意事项

### 10.1 认证相关
- **所有接口均需要认证**，未登录用户无法访问任何接口
- Token有效期24小时，过期需重新登录
- 首次登录会自动创建账号，无需注册
- 用户模型包含`role`（权限）和`institution`（学校/机构）字段：
  - `role`: superAdmin（超级管理员）、admin（管理员）、teacher（教师）、student（学生）
  - `institution`: 用于数据隔离，必填字段

### 10.2 限流保护
- 发送验证码：1分钟内最多1次
- 登录：15分钟内最多10次
- 发帖/评论：1分钟内最多5次
- 点赞/收藏：1秒内最多10次
- 通用接口：1分钟内最多100次

### 10.3 文件上传
- 支持格式：jpg、png、gif、webp
- 单张图片最大5MB
- 帖子最多9张图片
- 评论最多1张图片

### 10.4 内容限制
- 帖子内容：最多800字
- 评论内容：最多500字
- 昵称：1-50字符
- 投票选项：最多100字

### 10.5 时间处理
- 后端返回ISO 8601格式时间戳
- 前端需自行格式化为相对时间（如"2小时前"）
- 建议使用 dayjs 或 moment.js 处理时间

### 10.6 数据隔离
- 帖子数据根据用户的`institution`字段进行隔离
- 用户只能看到以下帖子：
  - 发布者的`institution`与当前用户的`institution`相同的帖子
  - `syncToUni`为`true`的帖子（同步到所有Uni的帖子）
- 发布帖子时，系统会自动将当前用户的`institution`写入帖子的`institution`字段

---