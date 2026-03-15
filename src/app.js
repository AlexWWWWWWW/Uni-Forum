require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/database');
const { generalLimiter } = require('./middlewares/rateLimiter');
const { startHotScoreJob } = require('./jobs/hotScoreJob');

// 导入路由
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const pollRoutes = require('./routes/pollRoutes');
const topicRoutes = require('./routes/topicRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// 连接数据库并启动定时任务/服务
const start = async () => {
  await connectDB();
  startHotScoreJob();
};

// 中间件配置
app.use(helmet()); // 安全头部
app.use(cors()); // 跨域支持
app.use(morgan('dev')); // 日志
app.use(express.json()); // 解析JSON
app.use(express.urlencoded({ extended: true })); // 解析URL编码

// 静态文件服务（上传的文件）
// 针对静态资源目录（图片文件夹）：放宽策略
app.use(
  '/uploads',
  // 第1步：设置响应头（允许跨域加载图片）
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
  // 第2步：服务静态文件（使用绝对路径，更稳健）
  express.static(path.join(__dirname, '../uploads'))
);

// 通用限流
app.use('/api', generalLimiter);

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/user', authRoutes); // 用户信息路由也在authRoutes中
app.use('/api/posts', postRoutes); // 修复：挂载到 /api/posts
app.use('/api', commentRoutes);
app.use('/api', interactionRoutes);
app.use('/api', pollRoutes);
app.use('/api', topicRoutes);
app.use('/api/upload', uploadRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'Uni-Forum API Server',
    version: '1.0.0',
    status: 'running',
    docs: '/api-docs'
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null,
    timestamp: new Date().toISOString()
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('全局错误:', err);
  
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误',
    data: null,
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
start().then(() => {
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║   🚀 Uni-Forum API Server Started    ║
║                                       ║
║   Port: ${PORT}                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}            ║
║   Time: ${new Date().toLocaleString()}  ║
║                                       ║
╚═══════════════════════════════════════╝
  `);
  });
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});

module.exports = app;

