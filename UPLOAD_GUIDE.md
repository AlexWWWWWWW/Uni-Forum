# 文件上传指南

## 问题排查

如果遇到 `401 Unauthorized` 错误，请检查以下几点：

### 1. Token 是否正确设置

**uni-app 上传文件示例：**

```javascript
// 正确的上传方式
uni.uploadFile({
  url: 'https://gplkyyqadzzu.sealosgzg.site/api/upload/image',
  filePath: tempFilePath,
  name: 'file',
  header: {
    'Authorization': 'Bearer ' + token  // ⚠️ 必须设置 Authorization 头
  },
  formData: {
    'type': 'post'  // 可选
  },
  success: (res) => {
    const data = JSON.parse(res.data);
    if (data.code === 200) {
      console.log('上传成功:', data.data.url);
    } else {
      console.error('上传失败:', data.message);
    }
  },
  fail: (err) => {
    console.error('上传错误:', err);
  }
});
```

### 2. 常见错误

#### ❌ 错误示例 1：没有设置 Authorization 头
```javascript
uni.uploadFile({
  url: 'https://gplkyyqadzzu.sealosgzg.site/api/upload/image',
  filePath: tempFilePath,
  name: 'file',
  // ❌ 缺少 header
});
```

#### ❌ 错误示例 2：Token 格式不正确
```javascript
header: {
  'Authorization': token  // ❌ 缺少 "Bearer " 前缀
}
```

#### ✅ 正确示例
```javascript
header: {
  'Authorization': 'Bearer ' + token  // ✅ 正确格式
}
```

### 3. 检查 Token 是否有效

```javascript
// 检查 token 是否存在
const token = uni.getStorageSync('token');
if (!token) {
  console.error('Token 不存在，请先登录');
  return;
}

console.log('Token:', token);
```

### 4. 调试方法

在 `authMiddleware` 中添加了日志，服务器会输出：
- 如果缺少 Authorization 头，会输出请求头信息
- 如果 token 无效，会输出错误信息

查看服务器日志：
```bash
# 查看服务器日志
# 应该能看到认证相关的日志信息
```

## 完整的上传示例

### uni-app 单张图片上传

```javascript
// pages/post-create.vue
export default {
  methods: {
    async uploadImage(filePath) {
      // 1. 获取 token
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      // 2. 显示上传进度
      uni.showLoading({
        title: '上传中...'
      });

      try {
        // 3. 上传文件
        const res = await new Promise((resolve, reject) => {
          uni.uploadFile({
            url: 'https://gplkyyqadzzu.sealosgzg.site/api/upload/image',
            filePath: filePath,
            name: 'file',
            header: {
              'Authorization': 'Bearer ' + token  // ⚠️ 关键：必须设置
            },
            formData: {
              'type': 'post'
            },
            success: (uploadRes) => {
              try {
                const data = JSON.parse(uploadRes.data);
                if (data.code === 200) {
                  resolve(data);
                } else {
                  reject(new Error(data.message || '上传失败'));
                }
              } catch (e) {
                reject(new Error('解析响应失败'));
              }
            },
            fail: (err) => {
              reject(err);
            }
          });
        });

        uni.hideLoading();
        uni.showToast({
          title: '上传成功',
          icon: 'success'
        });

        return res.data.url;
      } catch (error) {
        uni.hideLoading();
        console.error('上传失败:', error);
        
        // 处理401错误
        if (error.statusCode === 401 || error.message?.includes('401')) {
          uni.showModal({
            title: '提示',
            content: '登录已过期，请重新登录',
            success: (modalRes) => {
              if (modalRes.confirm) {
                // 清除token，跳转登录页
                uni.removeStorageSync('token');
                uni.reLaunch({
                  url: '/pages/login/login'
                });
              }
            }
          });
        } else {
          uni.showToast({
            title: error.message || '上传失败',
            icon: 'none'
          });
        }
        throw error;
      }
    },

    async chooseImages() {
      try {
        const res = await uni.chooseImage({
          count: 9,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        });

        // 上传每张图片
        const uploadPromises = res.tempFilePaths.map(filePath => 
          this.uploadImage(filePath)
        );

        const urls = await Promise.all(uploadPromises);
        console.log('所有图片上传成功:', urls);
        return urls;
      } catch (error) {
        console.error('选择图片失败:', error);
      }
    }
  }
}
```

### 批量上传图片

```javascript
async uploadImages(filePaths) {
  const token = uni.getStorageSync('token');
  
  const uploadPromises = filePaths.map((filePath, index) => {
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: 'https://gplkyyqadzzu.sealosgzg.site/api/upload/image',
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': 'Bearer ' + token
        },
        formData: {
          'type': 'post'
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.code === 200) {
              resolve(data.data.url);
            } else {
              reject(new Error(data.message));
            }
          } catch (e) {
            reject(e);
          }
        },
        fail: reject
      });
    });
  });

  try {
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('批量上传失败:', error);
    throw error;
  }
}
```

## 使用 axios/fetch 上传（不推荐用于 uni-app）

如果使用 axios，需要特殊处理：

```javascript
import axios from 'axios';

const formData = new FormData();
formData.append('file', file);
formData.append('type', 'post');

const response = await axios.post(
  'https://gplkyyqadzzu.sealosgzg.site/api/upload/image',
  formData,
  {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'multipart/form-data'
    }
  }
);
```

## 检查清单

上传文件前，请确认：

- [ ] Token 已正确存储（`uni.getStorageSync('token')`）
- [ ] Authorization 头格式正确（`Bearer ${token}`）
- [ ] 请求 URL 正确
- [ ] 文件字段名称为 `file`（单张）或 `files`（批量）
- [ ] 文件大小不超过 5MB
- [ ] 文件格式为 jpg/png/gif/webp

## 错误码说明

| 错误码 | 说明 | 解决方法 |
|--------|------|----------|
| 401 | 未登录或token过期 | 重新登录获取新token |
| 400 | 文件格式不支持或文件过大 | 检查文件格式和大小 |
| 500 | 服务器错误 | 联系后端开发人员 |

## 测试接口

可以使用 Postman 测试：

1. 选择 POST 方法
2. URL: `https://gplkyyqadzzu.sealosgzg.site/api/upload/image`
3. Headers:
   - `Authorization: Bearer YOUR_TOKEN`
4. Body:
   - 选择 form-data
   - Key: `file` (类型选择 File)
   - Value: 选择图片文件
5. 点击 Send

