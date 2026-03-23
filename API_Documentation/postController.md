## 2. 帖子模块

### 2.1 获取帖子列表

**接口地址：** `GET /api/posts`

**请求参数（Query）：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页数量，默认20，最大100 |
| category | String | 否 | 分类：all/hot/话题id（如technology, life等，通过话题接口获取） |
| sortBy | String | 否 | 排序：latest(最新)。注：category=hot 时固定返回热榜前10 |

**请求示例：**
```
GET /api/posts?page=1&pageSize=20&category=study&sortBy=latest
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
        "topic": "study",
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
    "topic": "casual",
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
- `topic`: 必填，话题id（如technology, life, study等），通过 `GET /api/topics` 接口获取可用话题列表
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
        "topic": "study",
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
