import express from 'express'
import { body } from 'express-validator'
import { authenticate, authorize } from '~/middlewares/authMiddleware'
import { validationMiddleware } from '~/middlewares/validationMiddleware'
import paymentController from '~/controllers/paymentController'

/**
 * Payment Routes - Định nghĩa các endpoint cho thanh toán
 */

const router = express.Router()

/**
 * Public routes (không cần authentication)
 */

// Xử lý callback từ VNPay
router.get(
  '/vnpay/callback',
  paymentController.handleVNPayCallback
)

// Xử lý callback từ Momo
router.get(
  '/momo/callback',
  paymentController.handleMomoCallback
)

// Xử lý IPN từ VNPay
router.post(
  '/vnpay/ipn',
  paymentController.handleVNPayIPN
)

// Xử lý IPN từ Momo
router.post(
  '/momo/ipn',
  paymentController.handleMomoIPN
)

// Lấy danh sách phương thức thanh toán
router.get(
  '/methods',
  paymentController.getPaymentMethods
)

// Lấy danh sách payments (Admin only)
router.get(
  '/',
  authenticate,
  authorize('admin'),
  paymentController.getPayments
)

// Lấy payment theo ID (Admin only)
router.get(
  '/:paymentId',
  authenticate,
  authorize('admin'),
  paymentController.getPaymentById
)

// Lấy payment theo transactionCode (Admin only)
router.get(
  '/transaction/:transactionCode',
  authenticate,
  authorize('admin'),
  paymentController.getPaymentByTransactionCode
)

// Tạo payment cho COD (Admin only)
router.post(
  '/cod',
  authenticate,
  authorize('admin'),
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('description').optional().isString().withMessage('Description must be a string')
  ],
  validationMiddleware,
  paymentController.createCODPayment
)

/**
 * Protected routes (cần authentication)
 */

// Tạo URL thanh toán VNPay
router.post(
  '/vnpay',
  authenticate,
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('orderDescription').notEmpty().withMessage('Order description is required')
  ],
  validationMiddleware,
  paymentController.createVNPayPayment
)

// Tạo URL thanh toán Momo
router.post(
  '/momo',
  authenticate,
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('orderDescription').notEmpty().withMessage('Order description is required')
  ],
  validationMiddleware,
  paymentController.createMomoPayment
)

export default router
