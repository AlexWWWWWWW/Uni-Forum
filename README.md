# Uni-Forum 后端API

基于 Node.js + Express + MongoDB 的论坛后端服务

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

### 3. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## API 文档

详细API文档请查看 `API_DOCUMENTATION.md`

## 项目结构

```
├── src/
│   ├── models/          # 数据模型
│   ├── controllers/     # 控制器
│   ├── routes/          # 路由
│   ├── middlewares/     # 中间件
│   ├── utils/           # 工具函数
│   ├── config/          # 配置文件
│   └── app.js          # 主入口
├── uploads/             # 上传文件目录
├── package.json
└── README.md
```

## 技术栈

- Express.js - Web框架
- MongoDB + Mongoose - 数据库
- JWT - 身份认证
- Nodemailer - 邮件服务
- Multer - 文件上传

## 认证方式

本系统采用 **邮箱+验证码** 的方式登录，**无需注册**。

- ✅ 输入邮箱获取验证码
- ✅ 输入验证码即可登录
- ✅ 首次登录自动创建账号
- ✅ 5分钟有效期
- ✅ 安全便捷

详细文档请查看 `API_AUTH.md`
