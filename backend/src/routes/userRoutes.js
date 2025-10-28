import express from 'express'
import { body } from 'express-validator'
import { authenticate, authorize } from '~/middlewares/authMiddleware'
import { authorizeRoles } from '~/middlewares/authorizeRoles'
import { validationMiddleware } from '~/middlewares/validationMiddleware'
import { upload } from '~/middlewares/uploadMiddleware'
import userController from '~/controllers/userController'

/**
 * User Routes - Định nghĩa các endpoint cho user management
 * Authentication endpoints đã được chuyển sang /api/auth
 * Routes này chỉ dành cho user profile và admin management
 */

const router = express.Router()

/**
 * Public routes (không cần authentication)
 * Các chức năng authentication đã được chuyển sang /api/auth
 */

/**
 * Protected routes (cần authentication)
 * Các chức năng authentication cơ bản đã chuyển sang /api/auth
 */

// Lấy thông tin profile chi tiết (khác với /api/auth/me - chỉ lấy thông tin cơ bản)
router.get('/profile', authenticate, userController.getProfile)

// Cập nhật profile user
router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
    body('address').optional().trim().isLength({ max: 200 }).withMessage('Address must not exceed 200 characters')
  ],
  validationMiddleware,
  userController.updateProfile
)

// Upload avatar
router.post(
  '/upload-avatar',
  authenticate,
  upload.single('avatar'),
  userController.uploadAvatar
)

/**
 * Admin routes (cần admin role)
 */

// Lấy danh sách user (Admin only)
router.get(
  '/',
  authenticate,
  authorize('admin'),
  userController.getUsers
)

// Lấy user theo ID (Admin only)
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  userController.getUserById
)

// Cập nhật user (Admin only)
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
    body('address').optional().trim().isLength({ max: 200 }).withMessage('Address must not exceed 200 characters'),
    body('roleId').optional().isMongoId().withMessage('Role ID must be a valid MongoDB ObjectId'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  validationMiddleware,
  userController.updateUser
)

// Xóa user (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('admin'),
  userController.deleteUser
)

// Cập nhật role của user (Admin only)
router.patch(
  '/:id/role',
  authenticate,
  authorizeRoles('admin'),
  [
    body('roleId')
      .notEmpty()
      .withMessage('Role ID is required')
      .isMongoId()
      .withMessage('Role ID must be a valid MongoDB ObjectId')
  ],
  validationMiddleware,
  userController.updateUserRole
)

export default router