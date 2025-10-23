import express from 'express'
import { body, param } from 'express-validator'
import { authenticate } from '~/middlewares/authMiddleware'
import { validationMiddleware } from '~/middlewares/validationMiddleware'
import * as cartController from '~/controllers/cartController'

/**
 * Cart Routes - Định nghĩa các endpoint cho giỏ hàng
 * Theo Service-Based Architecture: Routes chỉ định tuyến, validation và middleware
 */

const router = express.Router()

/**
 * Protected routes (cần authentication)
 */

// Lấy giỏ hàng của user
router.get(
  '/',
  authenticate,
  cartController.getCart
)

// Thêm sách vào giỏ hàng
router.post(
  '/:bookId',
  authenticate,
  [
    param('bookId').isMongoId().withMessage('Book ID must be a valid MongoDB ObjectId'),
    body('quantity').optional().isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99')
  ],
  validationMiddleware,
  cartController.addToCart
)

// Cập nhật số lượng sách trong giỏ hàng
router.put(
  '/:bookId',
  authenticate,
  [
    param('bookId').isMongoId().withMessage('Book ID must be a valid MongoDB ObjectId'),
    body('quantity').isInt({ min: 0, max: 99 }).withMessage('Quantity must be between 0 and 99')
  ],
  validationMiddleware,
  cartController.updateCartItem
)

// Xóa sách khỏi giỏ hàng
router.delete(
  '/:bookId',
  authenticate,
  [
    param('bookId').isMongoId().withMessage('Book ID must be a valid MongoDB ObjectId')
  ],
  validationMiddleware,
  cartController.removeFromCart
)

// Xóa tất cả sách khỏi giỏ hàng
router.delete(
  '/',
  authenticate,
  cartController.clearCart
)

// Lấy tóm tắt giỏ hàng
router.get(
  '/summary',
  authenticate,
  cartController.getCartSummary
)

// Kiểm tra sách có trong giỏ hàng không
router.get(
  '/check/:bookId',
  authenticate,
  [
    param('bookId').isMongoId().withMessage('Book ID must be a valid MongoDB ObjectId')
  ],
  validationMiddleware,
  cartController.checkCartItem
)

export default router
