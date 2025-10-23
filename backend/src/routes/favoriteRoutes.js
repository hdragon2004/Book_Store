import express from 'express'
import { param } from 'express-validator'
import { authenticate } from '~/middlewares/authMiddleware'
import { validationMiddleware } from '~/middlewares/validationMiddleware'
import * as favoriteController from '~/controllers/favoriteController'

/**
 * Favorite Routes - Định nghĩa các endpoint cho favorites
 * Theo Service-Based Architecture: Routes chỉ định tuyến, validation và middleware
 */

const router = express.Router()

/**
 * Protected routes (cần authentication)
 */

// Thêm sách vào danh sách yêu thích
router.post(
  '/:bookId',
  authenticate,
  [
    param('bookId').isMongoId().withMessage('Book ID must be a valid MongoDB ObjectId')
  ],
  validationMiddleware,
  favoriteController.addToFavorites
)

// Xóa sách khỏi danh sách yêu thích
router.delete(
  '/:bookId',
  authenticate,
  [
    param('bookId').isMongoId().withMessage('Book ID must be a valid MongoDB ObjectId')
  ],
  validationMiddleware,
  favoriteController.removeFromFavorites
)

// Lấy danh sách sách yêu thích
router.get(
  '/',
  authenticate,
  favoriteController.getFavorites
)

// Lấy danh sách sách yêu thích với pagination
router.get(
  '/paginated',
  authenticate,
  favoriteController.getFavoritesWithPagination
)

// Kiểm tra sách có trong favorites không
router.get(
  '/check/:bookId',
  authenticate,
  [
    param('bookId').isMongoId().withMessage('Book ID must be a valid MongoDB ObjectId')
  ],
  validationMiddleware,
  favoriteController.checkFavorite
)

export default router
