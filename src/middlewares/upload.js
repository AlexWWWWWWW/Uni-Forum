const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 按日期创建子目录
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const dateDir = path.join(uploadDir, String(year), month, day);
    
    // 创建目录（如果不存在）
    fs.mkdirSync(dateDir, { recursive: true });
    
    cb(null, dateDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'image_' + uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持上传 jpg, png, gif, webp 格式的图片'), false);
  }
};

// 配置 multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 默认5MB
  }
});

// 错误处理中间件
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        code: 400,
        message: '文件大小超过限制（最大5MB）',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
    return res.status(400).json({
      code: 400,
      message: '文件上传错误：' + err.message,
      data: null,
      timestamp: new Date().toISOString()
    });
  }
  
  if (err) {
    return res.status(400).json({
      code: 400,
      message: err.message,
      data: null,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

module.exports = {
  uploadSingle: upload.single('file'),
  uploadMultiple: upload.array('files', 9),
  uploadImages: upload.array('images', 9),
  handleUploadError
};

