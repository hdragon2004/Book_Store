import express from 'express'
import { body, param } from 'express-validator'
import { authenticate } from '~/middlewares/authMiddleware'
import { validationMiddleware } from '~/middlewares/validationMiddleware'
import addressController from '~/controllers/addressController'

/**
 * Address Routes - Định nghĩa các endpoint cho địa chỉ giao hàng
 */

const router = express.Router()

// Tất cả routes đều cần authentication
router.use(authenticate)

/**
 * Lấy danh sách địa chỉ của user
 * GET /api/addresses
 */
router.get(
  '/',
  addressController.getUserAddresses
)

/**
 * Lấy địa chỉ mặc định của user
 * GET /api/addresses/default
 */
router.get(
  '/default',
  addressController.getDefaultAddress
)

/**
 * Tạo địa chỉ mới
 * POST /api/addresses
 */
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Receiver name is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('district').notEmpty().withMessage('District is required'),
    body('ward').notEmpty().withMessage('Ward is required'),
    body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean')
  ],
  validationMiddleware,
  addressController.createAddress
)

/**
 * Cập nhật địa chỉ
 * PUT /api/addresses/:id
 */
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid address ID'),
    body('name').optional().notEmpty().withMessage('Receiver name cannot be empty'),
    body('phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
    body('address').optional().notEmpty().withMessage('Address cannot be empty'),
    body('city').optional().notEmpty().withMessage('City cannot be empty'),
    body('district').optional().notEmpty().withMessage('District cannot be empty'),
    body('ward').optional().notEmpty().withMessage('Ward cannot be empty'),
    body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean')
  ],
  validationMiddleware,
  addressController.updateAddress
)

/**
 * Xóa địa chỉ
 * DELETE /api/addresses/:id
 */
router.delete(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid address ID')
  ],
  validationMiddleware,
  addressController.deleteAddress
)

/**
 * Đặt địa chỉ làm mặc định
 * PUT /api/addresses/:id/default
 */
router.put(
  '/:id/default',
  [
    param('id').isMongoId().withMessage('Invalid address ID')
  ],
  validationMiddleware,
  addressController.setDefaultAddress
)

export default router
