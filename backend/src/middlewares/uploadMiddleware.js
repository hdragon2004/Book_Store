import multer from 'multer'
import path from 'path'
import { config } from '~/config/environment'
import { AppError } from '~/utils/AppError'

/**
 * Upload Middleware - Xử lý upload file với multer
 * Hỗ trợ upload ảnh với validation và storage
 */

// Cấu hình storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    // Tạo tên file unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// Cấu hình storage cho chat images
const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/chat/')
  },
  filename: (req, file, cb) => {
    // Tạo tên file unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// Filter function để kiểm tra loại file
const fileFilter = (req, file, cb) => {
  // Kiểm tra MIME type
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError('Invalid file type. Only images are allowed.', 400), false)
  }
}

// Cấu hình multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Tối đa 5 files
  }
})

// Cấu hình multer cho chat
const chatUpload = multer({
  storage: chatStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB cho chat
    files: 1 // Chỉ 1 file cho chat
  }
})

// Export upload instance
export { upload }

// Middleware upload single file
export const uploadMiddleware = {
  single: (fieldName) => upload.single(fieldName),
  array: (fieldName, maxCount) => upload.array(fieldName, maxCount),
  fields: (fields) => upload.fields(fields),
  any: () => upload.any()
}

// Middleware upload cho chat
export const chatUploadMiddleware = {
  single: (fieldName) => chatUpload.single(fieldName)
}

// Middleware xử lý lỗi upload
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
        statusCode: 400
      })
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files.',
        statusCode: 400
      })
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name.',
        statusCode: 400
      })
    }
  }
  
  next(error)
}

export default uploadMiddleware