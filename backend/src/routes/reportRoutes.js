import express from 'express'
import { query } from 'express-validator'
import { authenticate, authorize } from '~/middlewares/authMiddleware'
import { validationMiddleware } from '~/middlewares/validationMiddleware'
import reportController from '~/controllers/reportController'

/**
 * Report Routes - Định nghĩa các endpoint cho báo cáo
 */

const router = express.Router()

/**
 * All routes require authentication and admin role
 */
router.use(authenticate)
router.use(authorize('admin'))

/**
 * Dashboard tổng quan
 * GET /api/v1/reports/dashboard
 */
router.get(
  '/dashboard',
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
  ],
  validationMiddleware,
  reportController.getDashboardStats
)

/**
 * Báo cáo doanh thu
 * GET /api/v1/reports/revenue
 */
router.get(
  '/revenue',
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    query('groupBy').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid group by value'),
    query('paymentMethod').optional().isIn(['cod', 'bank_transfer', 'credit_card', 'paypal']).withMessage('Invalid payment method'),
    query('status').optional().isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
  ],
  validationMiddleware,
  reportController.getRevenueReport
)

/**
 * Báo cáo sách bán chạy
 * GET /api/v1/reports/bestsellers
 */
router.get(
  '/bestsellers',
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('categoryId').optional().isMongoId().withMessage('Category ID must be a valid MongoDB ObjectId')
  ],
  validationMiddleware,
  reportController.getBestsellerReport
)

/**
 * Báo cáo khách hàng
 * GET /api/v1/reports/customers
 */
router.get(
  '/customers',
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validationMiddleware,
  reportController.getCustomerReport
)

/**
 * Báo cáo danh mục
 * GET /api/v1/reports/categories
 */
router.get(
  '/categories',
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
  ],
  validationMiddleware,
  reportController.getCategoryReport
)

/**
 * Báo cáo voucher
 * GET /api/v1/reports/vouchers
 */
router.get(
  '/vouchers',
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    query('voucherId').optional().isMongoId().withMessage('Voucher ID must be a valid MongoDB ObjectId')
  ],
  validationMiddleware,
  reportController.getVoucherReport
)

/**
 * Báo cáo tồn kho
 * GET /api/v1/reports/inventory
 */
router.get(
  '/inventory',
  [
    query('categoryId').optional().isMongoId().withMessage('Category ID must be a valid MongoDB ObjectId'),
    query('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be a non-negative integer'),
    query('sortBy').optional().isIn(['stock', 'price', 'title', 'createdAt']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  validationMiddleware,
  reportController.getInventoryReport
)

/**
 * Export báo cáo
 * GET /api/v1/reports/export/:type
 */
router.get(
  '/export/:type',
  [
    query('format').optional().isIn(['csv', 'excel']).withMessage('Format must be csv or excel'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
  ],
  validationMiddleware,
  reportController.exportReport
)

export default router
