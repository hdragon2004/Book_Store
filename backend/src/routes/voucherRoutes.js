import express from 'express'
import { body, query } from 'express-validator'
import { authenticate, authorize } from '~/middlewares/authMiddleware'
import { authorizeRoles } from '~/middlewares/authorizeRoles'
import { validationMiddleware } from '~/middlewares/validationMiddleware'
import voucherController from '~/controllers/voucherController'

/**
 * Voucher Routes - Định nghĩa các endpoint cho voucher
 */

const router = express.Router()

/**
 * Public routes (không cần authentication)
 */

// Lấy voucher theo code (public để check voucher)
router.get(
  '/code/:code',
  voucherController.getVoucherByCode
)

/**
 * Protected routes (cần authentication)
 */

// Lấy danh sách voucher
router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term must not exceed 100 characters'),
    query('type').optional().isIn(['percentage', 'fixed_amount', 'free_shipping']).withMessage('Invalid voucher type'),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  validationMiddleware,
  voucherController.getVouchers
)

// Lấy danh sách voucher có thể áp dụng (phải đặt trước /:id)
router.get(
  '/available',
  authenticate,
  [
    query('orderAmount').isNumeric().withMessage('Order amount must be a number'),
    query('categoryIds').optional().isString().withMessage('Category IDs must be a string'),
    query('bookIds').optional().isString().withMessage('Book IDs must be a string')
  ],
  validationMiddleware,
  voucherController.getAvailableVouchers
)

// Kiểm tra voucher có thể áp dụng
router.post(
  '/check',
  authenticate,
  [
    body('code').notEmpty().withMessage('Voucher code is required'),
    body('orderAmount').isNumeric().withMessage('Order amount must be a number'),
    body('categoryIds').optional().isArray().withMessage('Category IDs must be an array'),
    body('bookIds').optional().isArray().withMessage('Book IDs must be an array')
  ],
  validationMiddleware,
  voucherController.checkVoucher
)

// Lấy voucher theo ID (phải đặt sau các route cụ thể)
router.get(
  '/:id',
  authenticate,
  voucherController.getVoucherById
)

/**
 * Admin routes (cần quyền admin)
 */

// Tạo voucher mới (Admin only)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('code').notEmpty().withMessage('Voucher code is required'),
    body('name').notEmpty().withMessage('Voucher name is required'),
    body('type').isIn(['percentage', 'fixed_amount', 'free_shipping']).withMessage('Invalid voucher type'),
    body('value').isNumeric().withMessage('Voucher value must be a number'),
    body('validFrom').isISO8601().withMessage('Valid from date must be a valid date'),
    body('validTo').isISO8601().withMessage('Valid to date must be a valid date'),
    body('minOrderAmount').optional().isNumeric().withMessage('Minimum order amount must be a number'),
    body('maxDiscountAmount').optional().isNumeric().withMessage('Maximum discount amount must be a number'),
    body('usageLimit').optional().isInt({ min: 1 }).withMessage('Usage limit must be a positive integer')
  ],
  validationMiddleware,
  voucherController.createVoucher
)

// Cập nhật voucher (Admin only)
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    body('code').optional().notEmpty().withMessage('Voucher code cannot be empty'),
    body('name').optional().notEmpty().withMessage('Voucher name cannot be empty'),
    body('type').optional().isIn(['percentage', 'fixed_amount', 'free_shipping']).withMessage('Invalid voucher type'),
    body('value').optional().isNumeric().withMessage('Voucher value must be a number'),
    body('validFrom').optional().isISO8601().withMessage('Valid from date must be a valid date'),
    body('validTo').optional().isISO8601().withMessage('Valid to date must be a valid date')
  ],
  validationMiddleware,
  voucherController.updateVoucher
)

// Xóa voucher (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  voucherController.deleteVoucher
)

// Lấy thống kê voucher (Admin only)
router.get(
  '/:id/stats',
  authenticate,
  authorize('admin'),
  voucherController.getVoucherStats
)

export default router