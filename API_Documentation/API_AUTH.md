# 认证系统 API 文档

## 🔐 邮箱验证码登录系统

本系统采用**邮箱+验证码**的方式登录，**无需注册**。用户首次登录时会自动创建账号。

---

## 认证流程

```
1. 用户输入邮箱
   ↓
2. 请求发送验证码 → POST /api/auth/send-code
   ↓
3. 系统生成6位数验证码
   ↓
4. 验证码发送到用户邮箱
   ↓
5. 用户输入验证码
   ↓
6. 验证码登录 → POST /api/auth/login
   ↓
7. 系统验证验证码
   ↓
8. 首次登录：自动创建用户
   老用户：更新登录时间
   ↓
9. 返回 JWT Token
```

---

## API 接口

### 1. 发送验证码

**接口路径：** `POST /api/auth/send-code`

**请求参数：**
```json
{
  "email": "student@example.com"
}
```

**成功响应：**
```json
{
  "code": 200,
  "message": "验证码已发送，请查收邮件",
  "data": {
    "email": "student@example.com",
    "expiresIn": 300
  }
}
```

**错误响应：**
```json
{
  "code": 429,
  "message": "验证码发送过于频繁，请稍后再试",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

**限制说明：**
- 同一邮箱1分钟内只能发送一次验证码
- 验证码有效期：5分钟

---

### 2. 验证码登录

**接口路径：** `POST /api/auth/login`

**请求参数：**
```json
{
  "email": "student@example.com",
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
    "email": "student@example.com",
    "nickname": "student",
    "avatar": "https://example.com/avatar/default.jpg",
    "expiresIn": 86400
  }
}
```

**错误响应：**
```json
{
  "code": 400,
  "message": "验证码错误或已过期",
  "data": null,
  "timestamp": "2026-01-21T12:45:00Z"
}
```

**说明：**
- 首次登录会自动创建用户账号
- 默认昵称为邮箱前缀（@之前的部分）
- Token有效期24小时

---

### 3. 获取用户信息

**接口路径：** `GET /api/user/profile`

**请求头：**
```
Authorization: Bearer {token}
```

**成功响应：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "student@example.com",
    "nickname": "学生小明",
    "avatar": "https://example.com/avatar/default.jpg",
    "postCount": 15,
    "commentCount": 48,
    "favoriteCount": 23,
    "lastLoginAt": "2026-01-21T12:45:00Z"
  }
}
```

---

### 4. 更新用户信息

**接口路径：** `PUT /api/user/profile`

**请求头：**
```
Authorization: Bearer {token}
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
    "email": "student@example.com",
    "nickname": "新昵称",
    "avatar": "https://example.com/avatar/new.jpg"
  }
}
```

---

## 测试示例

### 使用 cURL 测试

#### 1. 发送验证码
```bash
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

#### 2. 查收邮件获取验证码，然后登录
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456"
  }'
```

#### 3. 使用返回的 token 获取用户信息
```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 4. 更新用户信息
```bash
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "我的新昵称"
  }'
```

---

## 验证码邮件模板

用户会收到一封包含以下内容的邮件：

```
🎓 Uni-Forum
大学生论坛社区

您的登录验证码

您好！

您正在登录 Uni-Forum，请使用以下验证码完成登录：

┌─────────────────┐
│   123456        │
└─────────────────┘

验证码有效期：5分钟

⚠️ 如果这不是您本人的操作，请忽略此邮件。
请勿将验证码透露给他人，以防账号被盗。

此邮件由系统自动发送，请勿回复
© 2026 Uni-Forum. All rights reserved.
```

---

## 安全特性

### 1. 验证码安全
- ✅ 6位随机数字
- ✅ 5分钟后自动过期
- ✅ 使用后立即失效
- ✅ 防止暴力破解

### 2. 发送限制
- ✅ 同一邮箱1分钟内只能发送一次
- ✅ 请求限流保护
- ✅ 防止恶意发送

### 3. Token安全
- ✅ JWT加密
- ✅ 24小时有效期
- ✅ 自动过期机制

### 4. 用户保护
- ✅ 账号状态检查
- ✅ 禁用账号无法登录
- ✅ 记录最后登录时间

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 参数错误或验证码错误 |
| 401 | 未登录或token过期 |
| 403 | 账号已被禁用 |
| 404 | 用户不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 环境配置

在 `.env` 文件中配置邮箱参数：

```env
# 邮箱配置
EMAIL_USER=your-email@qq.com
EMAIL_PASSWORD=your-qq-smtp-authorization-code
```

**说明：**
- 使用 QQ 邮箱 SMTP 服务
- 服务器：smtp.qq.com
- 端口：465 (SSL)
- 密码为授权码，不是邮箱密码

---

## 常见问题

### Q1: 收不到验证码邮件？
1. 检查邮箱地址是否正确
2. 查看垃圾邮件/广告邮件文件夹
3. 检查服务器邮箱配置是否正确
4. 查看服务器日志

### Q2: 验证码过期了怎么办？
重新请求发送验证码即可。

### Q3: 首次登录需要填写什么信息？
无需填写任何信息，系统会自动创建账号，默认昵称为邮箱前缀。登录后可以在个人中心修改昵称和头像。

### Q4: Token过期了怎么办？
重新进行邮箱验证码登录即可获取新的Token。

### Q5: 可以更换邮箱吗？
目前不支持更换邮箱，邮箱作为唯一标识。如需更换，请使用新邮箱重新登录。

