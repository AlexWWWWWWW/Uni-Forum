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
