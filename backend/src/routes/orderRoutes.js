import express from 'express'
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrders
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

// Universal route - User: chỉ orders của mình, Admin: tất cả orders
router.get('/', getOrders) // Lấy đơn hàng (phân quyền tự động)

// Admin routes
router.patch('/admin/:orderId/status', authorize('admin'), updateOrderStatus) // Cập nhật trạng thái (Admin)

export default router