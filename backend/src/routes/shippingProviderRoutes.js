import express from 'express'
import {
  getAllProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
  restoreProvider,
  getDefaultProvider,
  getActiveProviders,
  simulateShippingSelection
} from '~/controllers/shippingProviderController'
import { authenticate, authorize } from '~/middlewares/authMiddleware'

const router = express.Router()

// Public routes
router.get('/active', getActiveProviders) // Lấy danh sách đơn vị giao hàng đang hoạt động
router.get('/default', getDefaultProvider) // Lấy đơn vị giao hàng mặc định
router.post('/simulate-selection', simulateShippingSelection) // Mô phỏng chọn đơn vị giao hàng

// Admin routes - yêu cầu authentication và admin role
router.use(authenticate) // Tất cả routes dưới đây cần authentication
router.use(authorize('admin')) // Tất cả routes dưới đây cần admin role

router.get('/', getAllProviders) // Lấy tất cả đơn vị giao hàng (có phân trang, search, filter)
router.get('/:providerId', getProviderById) // Lấy đơn vị giao hàng theo ID
router.post('/', createProvider) // Tạo đơn vị giao hàng mới
router.put('/:providerId', updateProvider) // Cập nhật đơn vị giao hàng
router.delete('/:providerId', deleteProvider) // Xóa đơn vị giao hàng (soft delete)
router.patch('/:providerId/restore', restoreProvider) // Khôi phục đơn vị giao hàng

export default router
