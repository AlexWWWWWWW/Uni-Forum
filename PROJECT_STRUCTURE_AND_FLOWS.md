# 后端项目结构与主要流程说明（Uni-Forum Backend）

本文档说明当前后端代码的目录结构，以及各模块的典型请求处理流程（从请求进入到返回响应）。

---

## 1. 总体架构概览

该项目是基于 **Node.js + Express + MongoDB(Mongoose)** 的 REST API 服务。

一次请求的通用链路如下：

1. 客户端发起 HTTP 请求  
2. 入口应用注册的通用中间件处理（安全/CORS/日志/解析/限流等）  
3. 路由匹配（根据路径分发到不同模块）  
4. 业务控制器（Controller）执行业务逻辑  
5. 数据模型（Model）与 MongoDB 交互（读写/统计/事务性更新等）  
6. 返回统一格式的 JSON 响应；若异常则进入全局错误处理

入口文件见：[src/app.js](src/app.js)

---

## 2. 目录结构说明

### 2.1 根目录

- [package.json](package.json)：依赖与脚本（`npm run dev` / `npm start` / `npm test`）
- [start.sh](start.sh)：启动脚本（包含依赖检查、`.env`、创建 `uploads/` 等）
- [entrypoint.sh](entrypoint.sh)：容器/部署场景常用入口脚本（如存在）
- 文档：
  - [README.md](README.md)：快速开始与概述
  - [API_DOCUMENTATION.md](API_DOCUMENTATION.md)：完整接口文档
  - [API_TESTING.md](API_TESTING.md)：cURL/Postman 测试流程
  - [API_AUTH.md](API_AUTH.md)：认证系统说明
  - [UPLOAD_GUIDE.md](UPLOAD_GUIDE.md)：上传与 401 排查
  - [MIGRATION.md](MIGRATION.md)：认证系统迁移说明

### 2.2 `src/` 源码目录

- [src/app.js](src/app.js)：Express 应用入口、通用中间件、路由挂载、错误处理、启动监听
- `src/config/`
  - [src/config/database.js](src/config/database.js)：MongoDB 连接初始化（`connectDB()` 被入口调用）
- `src/routes/`：路由层（只负责路径与中间件组合，不写复杂业务）
  - [src/routes/authRoutes.js](src/routes/authRoutes.js)
  - [src/routes/postRoutes.js](src/routes/postRoutes.js)
  - [src/routes/commentRoutes.js](src/routes/commentRoutes.js)
  - [src/routes/interactionRoutes.js](src/routes/interactionRoutes.js)
  - [src/routes/pollRoutes.js](src/routes/pollRoutes.js)
  - [src/routes/topicRoutes.js](src/routes/topicRoutes.js)
  - [src/routes/uploadRoutes.js](src/routes/uploadRoutes.js)
- `src/controllers/`：控制器层（业务逻辑与组装响应）
  - [src/controllers/authController.js](src/controllers/authController.js)
  - [src/controllers/postController.js](src/controllers/postController.js)
  - [src/controllers/commentController.js](src/controllers/commentController.js)
  - [src/controllers/interactionController.js](src/controllers/interactionController.js)
  - [src/controllers/pollController.js](src/controllers/pollController.js)
  - [src/controllers/topicController.js](src/controllers/topicController.js)（示例：[`exports.getTopics`](src/controllers/topicController.js)）
  - [src/controllers/uploadController.js](src/controllers/uploadController.js)
- `src/models/`：数据模型（Mongoose Schema/Model）
  - [src/models/Post.js](src/models/Post.js)
  - [src/models/Counter.js](src/models/Counter.js)（用于自增业务 ID；见：[`Counter`](src/models/Counter.js)）
  - [src/models/Poll.js](src/models/Poll.js)（见：[`Poll`](src/models/Poll.js)、[`PollOption`](src/models/Poll.js)、[`PollVote`](src/models/Poll.js)）
  - 其他：User/Comment/Like/Favorite 等
- `src/middlewares/`：中间件（认证、限流、上传等横切逻辑）
  - [src/middlewares/auth.js](src/middlewares/auth.js)（见：[`authMiddleware`](src/middlewares/auth.js)、[`optionalAuth`](src/middlewares/auth.js)）
  - [src/middlewares/rateLimiter.js](src/middlewares/rateLimiter.js)（见：[`generalLimiter`](src/middlewares/rateLimiter.js)、[`postLimiter`](src/middlewares/rateLimiter.js)）
  - [src/middlewares/upload.js](src/middlewares/upload.js)：Multer 上传存储与目录创建
- `src/utils/`：工具函数
  - [src/utils/emailService.js](src/utils/emailService.js)（见：[`sendVerificationEmail`](src/utils/emailService.js)、[`generateVerificationCode`](src/utils/emailService.js)）
  - [src/utils/floorNumber.js](src/utils/floorNumber.js)（见：[`generateFloorNumber`](src/utils/floorNumber.js)）

### 2.3 `uploads/` 上传目录

- [uploads/](uploads/)：文件落盘目录
- 入口静态托管：在 [src/app.js](src/app.js) 中配置了 `/uploads` 静态资源路径，使已上传文件可通过 URL 访问。

---

## 3. 入口启动与全局中间件流程

入口文件 [src/app.js](src/app.js) 的关键职责：

1. 加载环境变量（dotenv）
2. 创建 Express app
3. 连接数据库（[`connectDB`](src/config/database.js)）
4. 注册通用中间件（helmet/cors/morgan/body parser 等）
5. 静态文件服务：`/uploads` -> `uploads/`
6. API 通用限流：`/api` -> [`generalLimiter`](src/middlewares/rateLimiter.js)
7. 路由挂载（认证/帖子/评论/互动/投票/话题/上传）
8. 404 处理与全局错误处理

---

## 4. 各模块典型流程

以下按“路由 -> 中间件 -> 控制器 -> 模型/工具 -> 响应”的形式概述。

### 4.1 认证模块（邮箱 + 验证码）

相关文件：
- 路由：[src/routes/authRoutes.js](src/routes/authRoutes.js)（在 [src/app.js](src/app.js) 同时挂载到 `/api/auth` 与 `/api/user`）
- 控制器：[src/controllers/authController.js](src/controllers/authController.js)
- 工具：[src/utils/emailService.js](src/utils/emailService.js)
- 中间件：[src/middlewares/auth.js](src/middlewares/auth.js)（需要认证的接口会使用 [`authMiddleware`](src/middlewares/auth.js)）

流程 A：发送验证码 `POST /api/auth/send-code`
1. 路由命中 auth 路由
2. 控制器生成验证码并持久化（对应 VerificationCode 模型，位于 `src/models/`）
3. 调用 [`sendVerificationEmail`](src/utils/emailService.js) 发送邮件
4. 返回 `{ code, message, data, timestamp }`

流程 B：验证码登录 `POST /api/auth/login`
1. 校验验证码有效性
2. 首次登录：创建用户；非首次：更新登录时间
3. 生成 JWT 并返回给客户端
4. 客户端后续请求用 `Authorization: Bearer {token}`

流程 C：获取/更新用户信息
- 需要携带 token，走 [`authMiddleware`](src/middlewares/auth.js) 完成 token 校验与用户识别，然后控制器读取/更新用户数据。

文档对齐：
- [API_AUTH.md](API_AUTH.md)
- [API_TESTING.md](API_TESTING.md)
- [MIGRATION.md](MIGRATION.md)

---

### 4.2 帖子模块

相关文件：
- 路由：[src/routes/postRoutes.js](src/routes/postRoutes.js)
- 控制器：[src/controllers/postController.js](src/controllers/postController.js)
- 模型：[src/models/Post.js](src/models/Post.js)、自增计数器：[src/models/Counter.js](src/models/Counter.js)

流程 A：获取帖子列表 `GET /api/posts`（可选认证）
1. 路由使用 [`optionalAuth`](src/middlewares/auth.js)（有 token 则解析用户，无 token 也允许）
2. 控制器按 query（page/pageSize/category/sortBy）查询帖子
3. 返回列表数据（时间字段为 ISO 8601，参见 [CHANGELOG.md](CHANGELOG.md)）

流程 B：发布帖子 `POST /api/posts`（强制认证 + 限流）
1. [`authMiddleware`](src/middlewares/auth.js) 校验身份
2. [`postLimiter`](src/middlewares/rateLimiter.js) 做频率限制
3. `express-validator` 对 body 字段校验（可见 [src/routes/postRoutes.js](src/routes/postRoutes.js) 的规则）
4. 控制器创建 Post；如使用自增业务 ID，则会依赖 [`Counter`](src/models/Counter.js)
5. 返回创建结果

流程 C：删除帖子 `DELETE /api/posts/:postId`
1. 强制认证
2. 控制器检查是否为作者（只允许删除自己的帖子）
3. 执行删除并返回结果

---

### 4.3 评论模块

相关文件：
- 路由：[src/routes/commentRoutes.js](src/routes/commentRoutes.js)
- 控制器：[src/controllers/commentController.js](src/controllers/commentController.js)
- 工具：楼层号生成 [`generateFloorNumber`](src/utils/floorNumber.js)

流程 A：获取评论列表 `GET /api/posts/:postId/comments`
1. 路由命中评论模块
2. 控制器按帖子 ID 查询评论并按顺序返回
3. 返回 `floor` 等展示字段（楼层号逻辑通常由 [`generateFloorNumber`](src/utils/floorNumber.js) 生成）

流程 B：发表评论 `POST /api/posts/:postId/comments`（强制认证 + 限流）
1. [`authMiddleware`](src/middlewares/auth.js) 校验身份
2. 控制器校验帖子存在性、内容长度等
3. 生成楼层号，保存评论
4. 返回评论 ID 与楼层号等信息

流程 C：删除评论 `DELETE /api/comments/:commentId`
1. 强制认证
2. 校验权限（通常仅作者可删）
3. 删除并返回结果

---

### 4.4 互动模块（点赞/收藏）

相关文件：
- 路由：[src/routes/interactionRoutes.js](src/routes/interactionRoutes.js)
- 控制器：[src/controllers/interactionController.js](src/controllers/interactionController.js)

典型流程（以点赞帖子为例 `POST /api/posts/:postId/like`）：
1. 强制认证
2. 控制器根据 action（like/unlike）写入或删除 Like 记录（对应模型位于 `src/models/`）
3. 更新计数并返回 `isLiked`、`likeCount`

收藏列表 `GET /api/user/favorites`：
1. 强制认证
2. 分页查询收藏记录并返回列表

---

### 4.5 投票模块

相关文件：
- 路由：[src/routes/pollRoutes.js](src/routes/pollRoutes.js)
- 控制器：[src/controllers/pollController.js](src/controllers/pollController.js)
- 模型：[src/models/Poll.js](src/models/Poll.js)（[`Poll`](src/models/Poll.js)、[`PollOption`](src/models/Poll.js)、[`PollVote`](src/models/Poll.js)）

提交流程 `POST /api/posts/:postId/poll/vote`：
1. 强制认证
2. 控制器校验投票与选项合法性、是否允许多选、是否重复投票等
3. 写入 [`PollVote`](src/models/Poll.js)，统计选项票数并计算占比
4. 返回最新统计

---

### 4.6 话题/分类模块

相关文件：
- 路由：[src/routes/topicRoutes.js](src/routes/topicRoutes.js)
- 控制器：[src/controllers/topicController.js](src/controllers/topicController.js)
- 模型：[src/models/Post.js](src/models/Post.js)

`GET /api/topics`：
1. 控制器返回话题列表，并统计每个话题下帖子数量（示例实现见：[`exports.getTopics`](src/controllers/topicController.js)，使用 `Post.countDocuments`）
2. 返回带 `postCount` 的话题集合

---

### 4.7 文件上传模块

相关文件：
- 路由：[src/routes/uploadRoutes.js](src/routes/uploadRoutes.js)
- 控制器：[src/controllers/uploadController.js](src/controllers/uploadController.js)
- 上传中间件：[src/middlewares/upload.js](src/middlewares/upload.js)

流程（单图 `POST /api/upload/image`）：
1. 强制认证（通常在路由层挂 [`authMiddleware`](src/middlewares/auth.js)）
2. Multer 中间件落盘：  
   - 在 [`src/middlewares/upload.js`](src/middlewares/upload.js) 中确保上传根目录存在  
   - 按日期创建子目录（年/月/日）并生成唯一文件名  
3. 控制器返回文件 URL（配合 [src/app.js](src/app.js) 的 `/uploads` 静态托管）

批量上传 `POST /api/upload/images` 同理，只是 `files` 为数组且有数量限制（文档中为最多 9 张）。

排查与前端示例：
- [UPLOAD_GUIDE.md](UPLOAD_GUIDE.md)

---

## 5. 响应格式与错误处理约定

- 通用响应结构：`{ code, message, data, timestamp }`（详见 [API_DOCUMENTATION.md](API_DOCUMENTATION.md)）
- 404：由 [src/app.js](src/app.js) 的 404 中间件统一返回
- 全局异常：由 [src/app.js](src/app.js) 的全局错误处理中间件统一兜底

---

## 6. 与文档/测试的对应关系

- 接口清单与字段说明：见 [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- 快速 cURL 测试流程：见 [API_TESTING.md](API_TESTING.md)
- 认证系统专项说明：见 [API_AUTH.md](API_AUTH.md)、迁移说明 [MIGRATION.md](MIGRATION.md)
- 上传专项说明与 401 排查：见 [UPLOAD_GUIDE.md](UPLOAD_GUIDE.md)、认证排查 [BACKEND_AUTH_CHECK.md](BACKEND_AUTH_CHECK.md)

---
```// filepath: /home/devbox/project/PROJECT_STRUCTURE_AND_FLOWS.md
# 后端项目结构与主要流程说明（Uni-Forum Backend）

本文档说明当前后端代码的目录结构，以及各模块的典型请求处理流程（从请求进入到返回响应）。

---

## 1. 总体架构概览

该项目是基于 **Node.js + Express + MongoDB(Mongoose)** 的 REST API 服务。

一次请求的通用链路如下：

1. 客户端发起 HTTP 请求  
2. 入口应用注册的通用中间件处理（安全/CORS/日志/解析/限流等）  
3. 路由匹配（根据路径分发到不同模块）  
4. 业务控制器（Controller）执行业务逻辑  
5. 数据模型（Model）与 MongoDB 交互（读写/统计/事务性更新等）  
6. 返回统一格式的 JSON 响应；若异常则进入全局错误处理

入口文件见：[src/app.js](src/app.js)

---

## 2. 目录结构说明

### 2.1 根目录

- [package.json](package.json)：依赖与脚本（`npm run dev` / `npm start` / `npm test`）
- [start.sh](start.sh)：启动脚本（包含依赖检查、`.env`、创建 `uploads/` 等）
- [entrypoint.sh](entrypoint.sh)：容器/部署场景常用入口脚本（如存在）
- 文档：
  - [README.md](README.md)：快速开始与概述
  - [API_DOCUMENTATION.md](API_DOCUMENTATION.md)：完整接口文档
  - [API_TESTING.md](API_TESTING.md)：cURL/Postman 测试流程
  - [API_AUTH.md](API_AUTH.md)：认证系统说明
  - [UPLOAD_GUIDE.md](UPLOAD_GUIDE.md)：上传与 401 排查
  - [MIGRATION.md](MIGRATION.md)：认证系统迁移说明

### 2.2 `src/` 源码目录

- [src/app.js](src/app.js)：Express 应用入口、通用中间件、路由挂载、错误处理、启动监听
- `src/config/`
  - [src/config/database.js](src/config/database.js)：MongoDB 连接初始化（`connectDB()` 被入口调用）
- `src/routes/`：路由层（只负责路径与中间件组合，不写复杂业务）
  - [src/routes/authRoutes.js](src/routes/authRoutes.js)
  - [src/routes/postRoutes.js](src/routes/postRoutes.js)
  - [src/routes/commentRoutes.js](src/routes/commentRoutes.js)
  - [src/routes/interactionRoutes.js](src/routes/interactionRoutes.js)
  - [src/routes/pollRoutes.js](src/routes/pollRoutes.js)
  - [src/routes/topicRoutes.js](src/routes/topicRoutes.js)
  - [src/routes/uploadRoutes.js](src/routes/uploadRoutes.js)
- `src/controllers/`：控制器层（业务逻辑与组装响应）
  - [src/controllers/authController.js](src/controllers/authController.js)
  - [src/controllers/postController.js](src/controllers/postController.js)
  - [src/controllers/commentController.js](src/controllers/commentController.js)
  - [src/controllers/interactionController.js](src/controllers/interactionController.js)
  - [src/controllers/pollController.js](src/controllers/pollController.js)
  - [src/controllers/topicController.js](src/controllers/topicController.js)（示例：[`exports.getTopics`](src/controllers/topicController.js)）
  - [src/controllers/uploadController.js](src/controllers/uploadController.js)
- `src/models/`：数据模型（Mongoose Schema/Model）
  - [src/models/Post.js](src/models/Post.js)
  - [src/models/Counter.js](src/models/Counter.js)（用于自增业务 ID；见：[`Counter`](src/models/Counter.js)）
  - [src/models/Poll.js](src/models/Poll.js)（见：[`Poll`](src/models/Poll.js)、[`PollOption`](src/models/Poll.js)、[`PollVote`](src/models/Poll.js)）
  - 其他：User/Comment/Like/Favorite 等
- `src/middlewares/`：中间件（认证、限流、上传等横切逻辑）
  - [src/middlewares/auth.js](src/middlewares/auth.js)（见：[`authMiddleware`](src/middlewares/auth.js)、[`optionalAuth`](src/middlewares/auth.js)）
  - [src/middlewares/rateLimiter.js](src/middlewares/rateLimiter.js)（见：[`generalLimiter`](src/middlewares/rateLimiter.js)、[`postLimiter`](src/middlewares/rateLimiter.js)）
  - [src/middlewares/upload.js](src/middlewares/upload.js)：Multer 上传存储与目录创建
- `src/utils/`：工具函数
  - [src/utils/emailService.js](src/utils/emailService.js)（见：[`sendVerificationEmail`](src/utils/emailService.js)、[`generateVerificationCode`](src/utils/emailService.js)）
  - [src/utils/floorNumber.js](src/utils/floorNumber.js)（见：[`generateFloorNumber`](src/utils/floorNumber.js)）

### 2.3 `uploads/` 上传目录

- [uploads/](uploads/)：文件落盘目录
- 入口静态托管：在 [src/app.js](src/app.js) 中配置了 `/uploads` 静态资源路径，使已上传文件可通过 URL 访问。

---

## 3. 入口启动与全局中间件流程

入口文件 [src/app.js](src/app.js) 的关键职责：

1. 加载环境变量（dotenv）
2. 创建 Express app
3. 连接数据库（[`connectDB`](src/config/database.js)）
4. 注册通用中间件（helmet/cors/morgan/body parser 等）
5. 静态文件服务：`/uploads` -> `uploads/`
6. API 通用限流：`/api` -> [`generalLimiter`](src/middlewares/rateLimiter.js)
7. 路由挂载（认证/帖子/评论/互动/投票/话题/上传）
8. 404 处理与全局错误处理

---

## 4. 各模块典型流程

以下按“路由 -> 中间件 -> 控制器 -> 模型/工具 -> 响应”的形式概述。

### 4.1 认证模块（邮箱 + 验证码）

相关文件：
- 路由：[src/routes/authRoutes.js](src/routes/authRoutes.js)（在 [src/app.js](src/app.js) 同时挂载到 `/api/auth` 与 `/api/user`）
- 控制器：[src/controllers/authController.js](src/controllers/authController.js)
- 工具：[src/utils/emailService.js](src/utils/emailService.js)
- 中间件：[src/middlewares/auth.js](src/middlewares/auth.js)（需要认证的接口会使用 [`authMiddleware`](src/middlewares/auth.js)）

流程 A：发送验证码 `POST /api/auth/send-code`
1. 路由命中 auth 路由
2. 控制器生成验证码并持久化（对应 VerificationCode 模型，位于 `src/models/`）
3. 调用 [`sendVerificationEmail`](src/utils/emailService.js) 发送邮件
4. 返回 `{ code, message, data, timestamp }`

流程 B：验证码登录 `POST /api/auth/login`
1. 校验验证码有效性
2. 首次登录：创建用户；非首次：更新登录时间
3. 生成 JWT 并返回给客户端
4. 客户端后续请求用 `Authorization: Bearer {token}`

流程 C：获取/更新用户信息
- 需要携带 token，走 [`authMiddleware`](src/middlewares/auth.js) 完成 token 校验与用户识别，然后控制器读取/更新用户数据。

文档对齐：
- [API_AUTH.md](API_AUTH.md)
- [API_TESTING.md](API_TESTING.md)
- [MIGRATION.md](MIGRATION.md)

---

### 4.2 帖子模块

相关文件：
- 路由：[src/routes/postRoutes.js](src/routes/postRoutes.js)
- 控制器：[src/controllers/postController.js](src/controllers/postController.js)
- 模型：[src/models/Post.js](src/models/Post.js)、自增计数器：[src/models/Counter.js](src/models/Counter.js)

流程 A：获取帖子列表 `GET /api/posts`（可选认证）
1. 路由使用 [`optionalAuth`](src/middlewares/auth.js)（有 token 则解析用户，无 token 也允许）
2. 控制器按 query（page/pageSize/category/sortBy）查询帖子
3. 返回列表数据（时间字段为 ISO 8601，参见 [CHANGELOG.md](CHANGELOG.md)）

流程 B：发布帖子 `POST /api/posts`（强制认证 + 限流）
1. [`authMiddleware`](src/middlewares/auth.js) 校验身份
2. [`postLimiter`](src/middlewares/rateLimiter.js) 做频率限制
3. `express-validator` 对 body 字段校验（可见 [src/routes/postRoutes.js](src/routes/postRoutes.js) 的规则）
4. 控制器创建 Post；如使用自增业务 ID，则会依赖 [`Counter`](src/models/Counter.js)
5. 返回创建结果

流程 C：删除帖子 `DELETE /api/posts/:postId`
1. 强制认证
2. 控制器检查是否为作者（只允许删除自己的帖子）
3. 执行删除并返回结果

---

### 4.3 评论模块

相关文件：
- 路由：[src/routes/commentRoutes.js](src/routes/commentRoutes.js)
- 控制器：[src/controllers/commentController.js](src/controllers/commentController.js)
- 工具：楼层号生成 [`generateFloorNumber`](src/utils/floorNumber.js)

流程 A：获取评论列表 `GET /api/posts/:postId/comments`
1. 路由命中评论模块
2. 控制器按帖子 ID 查询评论并按顺序返回
3. 返回 `floor` 等展示字段（楼层号逻辑通常由 [`generateFloorNumber`](src/utils/floorNumber.js) 生成）

流程 B：发表评论 `POST /api/posts/:postId/comments`（强制认证 + 限流）
1. [`authMiddleware`](src/middlewares/auth.js) 校验身份
2. 控制器校验帖子存在性、内容长度等
3. 生成楼层号，保存评论
4. 返回评论 ID 与楼层号等信息

流程 C：删除评论 `DELETE /api/comments/:commentId`
1. 强制认证
2. 校验权限（通常仅作者可删）
3. 删除并返回结果

---

### 4.4 互动模块（点赞/收藏）

相关文件：
- 路由：[src/routes/interactionRoutes.js](src/routes/interactionRoutes.js)
- 控制器：[src/controllers/interactionController.js](src/controllers/interactionController.js)

典型流程（以点赞帖子为例 `POST /api/posts/:postId/like`）：
1. 强制认证
2. 控制器根据 action（like/unlike）写入或删除 Like 记录（对应模型位于 `src/models/`）
3. 更新计数并返回 `isLiked`、`likeCount`

收藏列表 `GET /api/user/favorites`：
1. 强制认证
2. 分页查询收藏记录并返回列表

---

### 4.5 投票模块

相关文件：
- 路由：[src/routes/pollRoutes.js](src/routes/pollRoutes.js)
- 控制器：[src/controllers/pollController.js](src/controllers/pollController.js)
- 模型：[src/models/Poll.js](src/models/Poll.js)（[`Poll`](src/models/Poll.js)、[`PollOption`](src/models/Poll.js)、[`PollVote`](src/models/Poll.js)）

提交流程 `POST /api/posts/:postId/poll/vote`：
1. 强制认证
2. 控制器校验投票与选项合法性、是否允许多选、是否重复投票等
3. 写入 [`PollVote`](src/models/Poll.js)，统计选项票数并计算占比
4. 返回最新统计

---

### 4.6 话题/分类模块

相关文件：
- 路由：[src/routes/topicRoutes.js](src/routes/topicRoutes.js)
- 控制器：[src/controllers/topicController.js](src/controllers/topicController.js)
- 模型：[src/models/Post.js](src/models/Post.js)

`GET /api/topics`：
1. 控制器返回话题列表，并统计每个话题下帖子数量（示例实现见：[`exports.getTopics`](src/controllers/topicController.js)，使用 `Post.countDocuments`）
2. 返回带 `postCount` 的话题集合

---

### 4.7 文件上传模块

相关文件：
- 路由：[src/routes/uploadRoutes.js](src/routes/uploadRoutes.js)
- 控制器：[src/controllers/uploadController.js](src/controllers/uploadController.js)
- 上传中间件：[src/middlewares/upload.js](src/middlewares/upload.js)

流程（单图 `POST /api/upload/image`）：
1. 强制认证（通常在路由层挂 [`authMiddleware`](src/middlewares/auth.js)）
2. Multer 中间件落盘：  
   - 在 [`src/middlewares/upload.js`](src/middlewares/upload.js) 中确保上传根目录存在  
   - 按日期创建子目录（年/月/日）并生成唯一文件名  
3. 控制器返回文件 URL（配合 [src/app.js](src/app.js) 的 `/uploads` 静态托管）

批量上传 `POST /api/upload/images` 同理，只是 `files` 为数组且有数量限制（文档中为最多 9 张）。

排查与前端示例：
- [UPLOAD_GUIDE.md](UPLOAD_GUIDE.md)

---

## 5. 响应格式与错误处理约定

- 通用响应结构：`{ code, message, data, timestamp }`（详见 [API_DOCUMENTATION.md](API_DOCUMENTATION.md)）
- 404：由 [src/app.js](src/app.js) 的 404 中间件统一返回
- 全局异常：由 [src/app.js](src/app.js) 的全局错误处理中间件统一兜底

---

## 6. 与文档/测试的对应关系

- 接口清单与字段说明：见 [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- 快速 cURL 测试流程：见 [API_TESTING.md](API_TESTING.md)
- 认证系统专项说明：见 [API_AUTH.md](API_AUTH.md)、迁移说明 [MIGRATION.md](MIGRATION.md)
- 上传专项说明与 401 排查：见 [UPLOAD_GUIDE.md](UPLOAD_GUIDE.md)、认证排查 [BACKEND_AUTH_CHECK.md](BACKEND_AUTH_CHECK.md)

---