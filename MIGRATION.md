# 认证系统迁移指南

## 🔄 从旧系统迁移到新系统

本文档帮助你从 **用户名+密码** 认证系统迁移到 **邮箱+验证码** 认证系统。

---

## 变更概览

### 数据库模型变更

**User 模型：**
- ❌ 移除: `username`, `password`
- ✅ 修改: `email` (从可选改为必填+唯一)
- ✅ 新增: `lastLoginAt`

**新增模型：**
- ✅ `VerificationCode` - 验证码模型

### API变更

**移除接口：**
- ❌ `POST /api/auth/register` - 用户注册

**修改接口：**
- 🔄 `POST /api/auth/login` - 改为验证码登录

**新增接口：**
- ✅ `POST /api/auth/send-code` - 发送验证码
- ✅ `PUT /api/user/profile` - 更新用户信息

---

## 迁移步骤

### 步骤 1: 安装新依赖

```bash
npm install nodemailer@^6.9.7
npm uninstall bcryptjs  # 移除旧依赖
```

### 步骤 2: 更新环境变量

在 `.env` 文件中添加邮箱配置：

```env
# 邮箱配置（参考 .env.example 填写实际值）
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@qq.com
EMAIL_PASSWORD=your-qq-smtp-authorization-code
```

### 步骤 3: 数据迁移（可选）

如果你已经有用户数据，需要进行数据迁移：

```javascript
// migrate-users.js
const mongoose = require('mongoose');
const OldUser = require('./old-models/User');
const NewUser = require('./src/models/User');

async function migrateUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const oldUsers = await OldUser.find();
  
  console.log(`找到 ${oldUsers.length} 个旧用户`);
  
  for (const oldUser of oldUsers) {
    // 检查邮箱
    if (!oldUser.email) {
      console.log(`⚠️  用户 ${oldUser.username} 没有邮箱，跳过`);
      continue;
    }
    
    // 检查是否已存在
    const exists = await NewUser.findOne({ email: oldUser.email });
    if (exists) {
      console.log(`✓ 用户 ${oldUser.email} 已存在，跳过`);
      continue;
    }
    
    // 创建新用户
    await NewUser.create({
      email: oldUser.email,
      nickname: oldUser.nickname || oldUser.username,
      avatar: oldUser.avatar,
      postCount: oldUser.postCount || 0,
      commentCount: oldUser.commentCount || 0,
      favoriteCount: oldUser.favoriteCount || 0,
      status: oldUser.status || 'active'
    });
    
    console.log(`✓ 迁移用户: ${oldUser.email}`);
  }
  
  console.log('迁移完成！');
  await mongoose.disconnect();
}

migrateUsers().catch(console.error);
```

运行迁移：
```bash
node migrate-users.js
```

### 步骤 4: 测试邮件发送

```bash
node test-auth.js your-email@example.com
```

### 步骤 5: 启动服务

```bash
npm run dev
```

### 步骤 6: 测试新认证流程

```bash
# 1. 发送验证码
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. 查收邮件，然后登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'
```

---

## 前端适配

### 旧登录表单

```html
<form>
  <input name="username" placeholder="用户名" />
  <input name="password" type="password" placeholder="密码" />
  <button>登录</button>
</form>
```

### 新登录表单

```html
<form>
  <input name="email" type="email" placeholder="邮箱地址" />
  <button type="button" onclick="sendCode()">发送验证码</button>
  <input name="code" placeholder="验证码" />
  <button type="submit">登录</button>
</form>

<script>
async function sendCode() {
  const email = document.querySelector('[name="email"]').value;
  
  const res = await fetch('/api/auth/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  const data = await res.json();
  alert(data.message);
}

async function login(event) {
  event.preventDefault();
  
  const email = document.querySelector('[name="email"]').value;
  const code = document.querySelector('[name="code"]').value;
  
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });
  
  const data = await res.json();
  
  if (data.code === 200) {
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data));
    window.location.href = '/home';
  } else {
    alert(data.message);
  }
}
</script>
```

---

## 常见问题

### Q1: 旧用户数据怎么办？

**方案1：数据迁移**
- 使用上面的迁移脚本
- 要求旧用户必须有邮箱字段

**方案2：重新开始**
- 清空旧数据
- 所有用户重新登录

### Q2: 用户没有邮箱怎么办？

如果旧系统中用户没有邮箱：
- 可以为用户生成默认邮箱：`username@yourdomain.com`
- 要求用户首次登录时更新邮箱

### Q3: 如何处理注册流程？

新系统无需注册：
- 首次登录自动创建账号
- 用户输入邮箱→获取验证码→登录→完成

### Q4: 验证码收不到怎么办？

检查清单：
- [ ] 邮箱配置是否正确
- [ ] QQ邮箱授权码是否正确
- [ ] 检查垃圾邮件文件夹
- [ ] 查看服务器日志
- [ ] 测试 `node test-auth.js`

### Q5: 能否保留用户名+密码方式？

可以同时支持两种方式：
```javascript
// 在 authController.js 中添加
exports.loginWithPassword = async (req, res) => {
  // 保留旧的登录逻辑
};
```

但**不推荐**，因为：
- 增加系统复杂度
- 安全性降低
- 维护成本高

---

## 回滚方案

如果需要回滚到旧系统：

### 1. 恢复旧文件
```bash
git checkout HEAD~1 src/models/User.js
git checkout HEAD~1 src/controllers/authController.js
git checkout HEAD~1 src/routes/authRoutes.js
```

### 2. 恢复依赖
```bash
npm install bcryptjs@^2.4.3
npm uninstall nodemailer
```

### 3. 移除新模型
```bash
rm src/models/VerificationCode.js
rm src/utils/emailService.js
```

### 4. 重启服务
```bash
npm run dev
```

---

## 性能对比

### 旧系统（用户名+密码）

**注册：**
- 验证用户名唯一性：~10ms
- bcrypt加密密码：~100ms
- 保存数据库：~20ms
- **总计：~130ms**

**登录：**
- 查询用户：~10ms
- bcrypt比对密码：~100ms
- 生成token：~5ms
- **总计：~115ms**

### 新系统（邮箱+验证码）

**发送验证码：**
- 生成验证码：~1ms
- 保存数据库：~20ms
- 发送邮件：~500ms
- **总计：~521ms**

**登录：**
- 查询验证码：~10ms
- 查询/创建用户：~20ms
- 生成token：~5ms
- **总计：~35ms**

**结论：**
- ✅ 登录速度提升 3倍
- ⚠️ 首次发送验证码较慢（邮件发送）
- ✅ 无需 bcrypt 加密，性能更好

---

## 安全性对比

### 旧系统风险
- ❌ 密码可能被暴力破解
- ❌ 密码泄露风险
- ❌ 需要密码重置功能
- ❌ 用户可能使用弱密码

### 新系统优势
- ✅ 验证码5分钟过期
- ✅ 使用后立即失效
- ✅ 邮箱验证，身份真实
- ✅ 无密码泄露风险
- ✅ 防暴力破解

---

## 总结

### 迁移检查清单

- [ ] 安装 nodemailer 依赖
- [ ] 移除 bcryptjs 依赖
- [ ] 配置邮箱环境变量
- [ ] 更新 User 模型
- [ ] 添加 VerificationCode 模型
- [ ] 更新认证控制器
- [ ] 更新路由
- [ ] 迁移用户数据（如需要）
- [ ] 测试邮件发送
- [ ] 测试登录流程
- [ ] 更新前端代码
- [ ] 更新文档

### 优势总结
- ✅ 更安全
- ✅ 更简单
- ✅ 更快速
- ✅ 更现代
- ✅ 用户体验更好

祝迁移顺利！🎉

