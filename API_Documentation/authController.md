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
