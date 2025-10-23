import express from 'express'
import { body } from 'express-validator'
import { authenticate } from '~/middlewares/authMiddleware'
import { validationMiddleware } from '~/middlewares/validationMiddleware'
import userController from '~/controllers/userController'

/**
 * User Routes - Định nghĩa các endpoint cho user
 * Theo Service-Based Architecture: Routes chỉ định tuyến, validation và middleware
 */

const router = express.Router()

/**
 * Public routes (không cần authentication)
 */

// Đăng ký user
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
    body('address').optional().trim().isLength({ max: 200 }).withMessage('Address must not exceed 200 characters')
  ],
  validationMiddleware,
  userController.register
)

// Đăng nhập user
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validationMiddleware,
  userController.login
)

// Quên mật khẩu
router.post(
  '/forgot-password',
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
  ],
  validationMiddleware,
  userController.forgotPassword
)

// Đặt lại mật khẩu
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validationMiddleware,
  userController.resetPassword
)

// Xác thực email
router.post(
  '/verify-email',
  [
    body('token').notEmpty().withMessage('Verification token is required')
  ],
  validationMiddleware,
  userController.verifyEmail
)

// Gửi lại email xác thực
router.post(
  '/resend-verification',
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
  ],
  validationMiddleware,
  userController.resendVerification
)

// Refresh token
router.post('/refresh-token', userController.refreshToken)

/**
 * Protected routes (cần authentication)
 */

// Đăng xuất
router.post('/logout', authenticate, userController.logout)

// Lấy thông tin profile
router.get('/profile', authenticate, userController.getProfile)

// Cập nhật profile
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

// Đổi mật khẩu
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  validationMiddleware,
  userController.changePassword
)

/**
 * Admin routes (cần admin role)
 */

// Lấy danh sách user
router.get(
  '/',
  authenticate,
  userController.getUsers
)

// Lấy user theo ID
router.get(
  '/:id',
  authenticate,
  userController.getUserById
)

// Cập nhật user
router.put(
  '/:id',
  authenticate,
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

// Xóa user
router.delete(
  '/:id',
  authenticate,
  userController.deleteUser
)

export default router