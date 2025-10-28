import express from 'express'
import { authenticate } from '~/middlewares/authMiddleware'
import {
  createDownloadLink,
  downloadFile,
  getDownloadInfo,
  streamFile,
  getOfflineInfo
} from '~/controllers/downloadController'

const router = express.Router()

// Routes không cần authentication (sử dụng token riêng)
// Stream file cho đọc online (sử dụng token từ query)
router.get('/stream/:bookId', streamFile)

// Routes cần authentication
router.use(authenticate)

// Tạo link download tạm thời
router.get('/temp/:bookId', createDownloadLink)

// Download file thực tế
router.get('/file/:bookId', downloadFile)

// Lấy thông tin download
router.get('/info/:bookId', getDownloadInfo)

// Lấy thông tin chi tiết cho offline reading
router.get('/offline-info/:bookId', getOfflineInfo)

export default router