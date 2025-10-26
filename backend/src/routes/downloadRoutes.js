import express from 'express'
import { authenticate } from '~/middlewares/authMiddleware'
import {
  createDownloadLink,
  downloadFile,
  getDownloadInfo,
  streamFile
} from '~/controllers/downloadController'

const router = express.Router()

// Tất cả routes đều cần authentication
router.use(authenticate)

// Tạo link download tạm thời
router.get('/temp/:bookId', createDownloadLink)

// Download file thực tế
router.get('/file/:bookId', downloadFile)

// Lấy thông tin download
router.get('/info/:bookId', getDownloadInfo)

// Stream file cho đọc online
router.get('/stream/:bookId', streamFile)

export default router