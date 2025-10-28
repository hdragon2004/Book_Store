import express from 'express'
import { body, query, param } from 'express-validator'
import { authenticate, authorize } from '~/middlewares/authMiddleware'
import { authorizeRoles } from '~/middlewares/authorizeRoles'
import { validationMiddleware } from '~/middlewares/validationMiddleware'
import categoryController from '~/controllers/categoryController'

/**
 * Category Routes - Định nghĩa các endpoint cho danh mục sách
 * Theo Service-Based Architecture: Routes chỉ định tuyến, validation và middleware
 */

const router = express.Router()

/**
 * Public routes (không cần authentication)
 */

// Lấy danh sách danh mục
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['name', 'createdAt']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  validationMiddleware,
  categoryController.getCategories
)

// Lấy danh mục theo ID
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Category ID must be a valid MongoDB ObjectId')
  ],
  validationMiddleware,
  categoryController.getCategoryById
)

// Tìm kiếm danh mục
router.get(
  '/search',
  [
    query('q').notEmpty().withMessage('Search term is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validationMiddleware,
  categoryController.searchCategories
)

// Lấy thống kê danh mục
router.get(
  '/stats',
  categoryController.getCategoryStats
)

/**
 * Protected routes (cần authentication)
 */

// Tạo danh mục mới (Admin only)
router.post(
  '/',
  authenticate,
  authorizeRoles('admin', 'staff'),
  [
    body('name').notEmpty().trim().isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
  ],
  validationMiddleware,
  categoryController.createCategory
)

// Cập nhật danh mục (Admin only)
router.put(
  '/:id',
  authenticate,
  authorizeRoles('admin', 'staff'),
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
  ],
  validationMiddleware,
  categoryController.updateCategory
)

// Xóa danh mục (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('admin', 'staff'),
  categoryController.deleteCategory
)

export default router