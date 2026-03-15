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