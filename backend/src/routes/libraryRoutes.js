import express from 'express'
import { 
  getMyLibrary, 
  getLibraryBook, 
  getDownloadHistory, 
  getLibraryStats, 
  searchLibrary 
} from '~/controllers/libraryController'
import { authenticate } from '~/middlewares/authMiddleware'

const router = express.Router()

// Tất cả routes đều cần xác thực
router.use(authenticate)

// Lấy danh sách sách trong thư viện
router.get('/', getMyLibrary)

// Lấy thông tin chi tiết sách trong thư viện
router.get('/book/:bookId', getLibraryBook)

// Lấy lịch sử tải
router.get('/downloads', getDownloadHistory)

// Lấy thống kê thư viện
router.get('/stats', getLibraryStats)

// Tìm kiếm trong thư viện
router.get('/search', searchLibrary)

export default router
