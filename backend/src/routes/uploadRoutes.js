import express from 'express'
import multer from 'multer'
import { authenticate } from '~/middlewares/authMiddleware'
import { uploadMiddleware } from '~/middlewares/uploadMiddleware'
import uploadController from '~/controllers/uploadController'

/**
 * Upload Routes - Định nghĩa các endpoint cho upload
 */

const router = express.Router()

// Upload ảnh chung (cần authentication)
router.post(
  '/image',
  authenticate,
  uploadMiddleware.single('image'),
  uploadController.uploadImage
)

// Error handling cho upload
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.log('❌ Multer error:', error);
    return res.status(400).json({
      success: false,
      message: error.message,
      statusCode: 400
    });
  }
  next(error);
});

export default router
