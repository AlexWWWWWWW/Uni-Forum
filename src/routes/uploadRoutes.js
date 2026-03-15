const express = require('express');
const uploadController = require('../controllers/uploadController');
const { authMiddleware } = require('../middlewares/auth');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middlewares/upload');

const router = express.Router();

// 上传单张图片
router.post('/image',
  authMiddleware,
  uploadSingle,
  handleUploadError,
  uploadController.uploadImage
);

// 批量上传图片
router.post('/images',
  authMiddleware,
  uploadMultiple,
  handleUploadError,
  uploadController.uploadImages
);

module.exports = router;

