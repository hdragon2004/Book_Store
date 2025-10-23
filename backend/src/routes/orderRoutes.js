import express from 'express'
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders
} from '~/controllers/orderController'
import { authenticate, authorize } from '~/middlewares/authMiddleware'

const router = express.Router()

// Tất cả routes đều cần authentication
router.use(authenticate)

// User routes
router.post('/', createOrder) // Tạo đơn hàng
router.get('/my-orders', getUserOrders) // Lấy đơn hàng của user
router.get('/:orderId', getOrderById) // Lấy chi tiết đơn hàng
router.patch('/:orderId/cancel', cancelOrder) // Hủy đơn hàng

// Admin routes
router.get('/admin/all', authorize('admin'), getAllOrders) // Lấy tất cả đơn hàng (Admin)
router.patch('/admin/:orderId/status', authorize('admin'), updateOrderStatus) // Cập nhật trạng thái (Admin)

export default router