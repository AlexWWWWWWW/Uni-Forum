const path = require('path');
const fs = require('fs').promises;

// 上传单张图片
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请上传图片文件',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const file = req.file;
    const baseUrl = process.env.CDN_URL || `http://localhost:${process.env.PORT || 3000}`;
    const uploadRoot = path.resolve(process.env.UPLOAD_DIR || 'uploads');
    
    let relativePath = file.filename;
    if (file.path) {
      relativePath = path.relative(uploadRoot, path.resolve(file.path)).replace(/\\/g, '/');
    }
    const fileUrl = `${baseUrl}/uploads/${relativePath}`;

    res.status(200).json({
      code: 200,
      message: '上传成功',
      data: {
        url: fileUrl,
        filename: file.filename,
        size: file.size,
        width: null, // 需要图片处理库来获取实际宽高
        height: null,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('上传图片错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

// 批量上传图片
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请上传图片文件',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (req.files.length > 9) {
      return res.status(400).json({
        code: 400,
        message: '最多上传9张图片',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const baseUrl = process.env.CDN_URL || `http://localhost:${process.env.PORT || 3000}`;
    const uploadRoot = path.resolve(process.env.UPLOAD_DIR || 'uploads');
    
    const images = req.files.map(file => {
      let relativePath = file.filename;
      if (file.path) {
        relativePath = path.relative(uploadRoot, path.resolve(file.path)).replace(/\\/g, '/');
      }
      return {
        url: `${baseUrl}/uploads/${relativePath}`,
        filename: file.filename,
        size: file.size
      };
    });

    res.status(200).json({
      code: 200,
      message: '上传成功',
      data: {
        images,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('批量上传图片错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

