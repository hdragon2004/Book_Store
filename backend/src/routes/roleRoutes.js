import express from 'express'
import { body, param, query } from 'express-validator'
import { authenticate, authorize } from '~/middlewares/authMiddleware'
import { authorizeRoles } from '~/middlewares/authorizeRoles'
import { validationMiddleware } from '~/middlewares/validationMiddleware'
import roleController from '~/controllers/roleController'

const router = express.Router()

/**
 * Public routes
 */

// Lấy tất cả roles (public)
router.get('/', roleController.getAllRoles)

// Tìm kiếm roles (public)
router.get(
  '/search',
  [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters')
  ],
  validationMiddleware,
  roleController.searchRoles
)

/**
 * Protected routes (require authentication)
 */

// Lấy role theo name
router.get(
  '/:roleName',
  authenticate,
  [
    param('roleName')
      .notEmpty()
      .withMessage('Role name is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('Role name must be between 1 and 50 characters')
  ],
  validationMiddleware,
  roleController.getRoleById
)

/**
 * Admin routes (require admin role)
 */

// Tạo role mới
router.post(
  '/',
  authenticate,
  authorizeRoles('admin'),
  [
    body('name')
      .notEmpty()
      .withMessage('Role name is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('Role name must be between 1 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Role name can only contain letters, numbers, and underscores'),
    body('description')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Description cannot exceed 200 characters')
  ],
  validationMiddleware,
  roleController.createRole
)

// Cập nhật role
router.put(
  '/:roleId',
  authenticate,
  authorizeRoles('admin'),
  [
    param('roleId')
      .isMongoId()
      .withMessage('Role ID must be a valid MongoDB ObjectId'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Role name must be between 1 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Role name can only contain letters, numbers, and underscores'),
    body('description')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Description cannot exceed 200 characters')
  ],
  validationMiddleware,
  roleController.updateRole
)

// Xóa role (soft delete)
router.delete(
  '/:roleId',
  authenticate,
  authorizeRoles('admin'),
  [
    param('roleId')
      .isMongoId()
      .withMessage('Role ID must be a valid MongoDB ObjectId')
  ],
  validationMiddleware,
  roleController.deleteRole
)

// Khôi phục role đã xóa
router.patch(
  '/:roleId/restore',
  authenticate,
  authorizeRoles('admin'),
  [
    param('roleId')
      .isMongoId()
      .withMessage('Role ID must be a valid MongoDB ObjectId')
  ],
  validationMiddleware,
  roleController.restoreRole
)

export default router
