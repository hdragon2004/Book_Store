import express from 'express'
import { body, param, query } from 'express-validator'
import { authorizeRoles } from '~/middlewares/authorizeRoles'
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrders,
  mockAutoConfirmPayment
} from '~/controllers/orderController'
import { authenticate, authorize } from '~/middlewares/authMiddleware'
import { validationMiddleware } from '~/middlewares/validationMiddleware'

const router = express.Router()

// Tất cả routes đều cần authentication
router.use(authenticate)

// User routes
router.post(
  '/', 
  [
    body('shippingAddressId')
      .isMongoId()
      .withMessage('Shipping address ID must be a valid MongoDB ObjectId'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('Items must be a non-empty array'),
    body('items.*.bookId')
      .isMongoId()
      .withMessage('Book ID must be a valid MongoDB ObjectId'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('paymentMethod')
      .optional()
      .isIn(['cod', 'bank_transfer', 'credit_card', 'paypal', 'momo', 'zalopay'])
      .withMessage('Invalid payment method'),
    body('voucherCode')
      .optional()
      .custom((value) => {
        if (value === null || value === undefined) return true
        return typeof value === 'string'
      })
      .withMessage('Voucher code must be a string or null'),
    body('note')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Note must be a string with maximum 500 characters')
  ],
  validationMiddleware,
  createOrder
) // Tạo đơn hàng

router.get(
  '/my-orders',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'digital_delivered'])
      .withMessage('Invalid status')
  ],
  validationMiddleware,
  getUserOrders
) // Lấy đơn hàng của user

router.get(
  '/:orderId',
  [
    param('orderId')
      .isMongoId()
      .withMessage('Order ID must be a valid MongoDB ObjectId')
  ],
  validationMiddleware,
  getOrderById
) // Lấy chi tiết đơn hàng

router.patch(
  '/:orderId/cancel',
  [
    param('orderId')
      .isMongoId()
      .withMessage('Order ID must be a valid MongoDB ObjectId')
  ],
  validationMiddleware,
  cancelOrder
) // Hủy đơn hàng

// Mock tự động xác nhận thanh toán QR (mô phỏng)
router.post(
  '/:orderId/mock-confirm-payment',
  [
    param('orderId')
      .isMongoId()
      .withMessage('Order ID must be a valid MongoDB ObjectId'),
    body('paymentMethod')
      .optional()
      .isIn(['momo', 'zalopay', 'bank_transfer'])
      .withMessage('Payment method must be one of: momo, zalopay, bank_transfer')
  ],
  validationMiddleware,
  mockAutoConfirmPayment
) // Mock tự động xác nhận thanh toán QR sau 5 giây

// Universal route - User: chỉ orders của mình, Admin: tất cả orders
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'digital_delivered'])
      .withMessage('Invalid status'),
    query('userId')
      .optional()
      .isMongoId()
      .withMessage('User ID must be a valid MongoDB ObjectId')
  ],
  validationMiddleware,
  getOrders
) // Lấy đơn hàng (phân quyền tự động)

// Admin routes
router.patch(
  '/admin/:orderId/status',
  authorizeRoles('admin', 'staff'),
  [
    param('orderId')
      .isMongoId()
      .withMessage('Order ID must be a valid MongoDB ObjectId'),
    body('status')
      .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'digital_delivered'])
      .withMessage('Invalid status'),
    body('shipper')
      .optional()
      .isObject()
      .withMessage('Shipper must be an object'),
    body('shipper.name')
      .optional()
      .isString()
      .withMessage('Shipper name must be a string'),
    body('shipper.phone')
      .optional()
      .isString()
      .withMessage('Shipper phone must be a string'),
    body('shipper.company')
      .optional()
      .isString()
      .withMessage('Shipper company must be a string'),
    body('shipper.trackingNumber')
      .optional()
      .isString()
      .withMessage('Shipper tracking number must be a string')
  ],
  validationMiddleware,
  updateOrderStatus
) // Cập nhật trạng thái (Admin)

export default router