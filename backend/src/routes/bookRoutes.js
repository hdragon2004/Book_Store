import express from 'express'
import { body, query } from 'express-validator'
import { authenticate, authorize } from '~/middlewares/authMiddleware'
import { authorizeRoles } from '~/middlewares/authorizeRoles'
import { validationMiddleware } from '~/middlewares/validationMiddleware'
import { uploadMiddleware } from '~/middlewares/uploadMiddleware'
import bookController from '~/controllers/bookController'

/**
 * Book Routes - Định nghĩa các endpoint cho sách
 * Theo Service-Based Architecture: Routes chỉ định tuyến, validation và middleware
 */

const router = express.Router()

/**
 * Public routes (không cần authentication)
 */

// Lấy danh sách sách
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term must not exceed 100 characters'),
    query('category').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Category must be between 1 and 100 characters'),
    query('author').optional().trim().isLength({ max: 100 }).withMessage('Author must not exceed 100 characters'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
    query('sortBy').optional().isIn(['title', 'author', 'price', 'createdAt', 'viewCount']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  validationMiddleware,
  bookController.getBooks
)

// Tìm kiếm sách
router.get(
  '/search',
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Category must be between 1 and 100 characters'),
    query('author').optional().trim().isLength({ max: 100 }).withMessage('Author must not exceed 100 characters'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number')
  ],
  validationMiddleware,
  bookController.searchBooks
)

// Lấy sách bán chạy
router.get(
  '/bestsellers',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  validationMiddleware,
  bookController.getBestsellers
)

// Lấy sách mới
router.get(
  '/new',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  validationMiddleware,
  bookController.getNewBooks
)

// Lấy sách theo danh mục
router.get(
  '/category/:categoryId',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['title', 'author', 'price', 'createdAt', 'viewCount']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  validationMiddleware,
  bookController.getBooksByCategory
)

// Lấy sách theo tác giả
router.get(
  '/author/:author',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['title', 'author', 'price', 'createdAt', 'viewCount']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  validationMiddleware,
  bookController.getBooksByAuthor
)

// Lấy thông tin sách theo ID
router.get('/:id', bookController.getBookById)

/**
 * Protected routes (cần authentication)
 */

// Upload ảnh sách
router.post(
  '/:id/upload-image',
  authenticate,
  uploadMiddleware.single('image'),
  bookController.uploadBookImage
)

/**
 * Admin routes (cần admin role)
 */

// Tạo sách mới (Admin only)
router.post(
  '/',
  authenticate,
  authorizeRoles('admin', 'staff'),
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    body('author').trim().isLength({ min: 1, max: 100 }).withMessage('Author must be between 1 and 100 characters'),
    body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Description must be between 1 and 2000 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('categoryId').isMongoId().withMessage('Category must be a valid MongoDB ObjectId'),
    body('isbn').optional().trim().isLength({ min: 10, max: 14 }).withMessage('ISBN must be between 10 and 14 characters'),
    body('publisher').optional().trim().isLength({ max: 100 }).withMessage('Publisher must not exceed 100 characters'),
    body('publicationDate').optional().isISO8601().withMessage('Publication date must be a valid date'),
    body('pages').optional().isInt({ min: 0 }).withMessage('Pages must be a non-negative integer'),
    body('format').optional().trim().isLength({ max: 50 }).withMessage('Format must not exceed 50 characters'),
    body('dimensions').optional().trim().isLength({ max: 100 }).withMessage('Dimensions must not exceed 100 characters'),
    body('weight').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  validationMiddleware,
  bookController.createBook
)

// Cập nhật sách (Admin only)
router.put(
  '/:id',
  authenticate,
  authorizeRoles('admin', 'staff'),
  [
    body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    body('author').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Author must be between 1 and 100 characters'),
    body('description').optional().trim().isLength({ min: 1, max: 2000 }).withMessage('Description must be between 1 and 2000 characters'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('categoryId').optional().isMongoId().withMessage('Category must be a valid MongoDB ObjectId'),
    body('isbn').optional().trim().isLength({ min: 10, max: 14 }).withMessage('ISBN must be between 10 and 14 characters'),
    body('publisher').optional().trim().isLength({ max: 100 }).withMessage('Publisher must not exceed 100 characters'),
    body('publicationDate').optional().isISO8601().withMessage('Publication date must be a valid date'),
    body('pages').optional().isInt({ min: 0 }).withMessage('Pages must be a non-negative integer'),
    body('format').optional().trim().isLength({ max: 50 }).withMessage('Format must not exceed 50 characters'),
    body('dimensions').optional().trim().isLength({ max: 100 }).withMessage('Dimensions must not exceed 100 characters'),
    body('weight').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  validationMiddleware,
  bookController.updateBook
)

// Xóa sách (Admin only)
router.delete('/:id', authenticate, authorizeRoles('admin', 'staff'), bookController.deleteBook)

// Cập nhật tồn kho (Admin only)
router.put(
  '/:id/stock',
  authenticate,
  authorizeRoles('admin', 'staff'),
  [
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('operation').isIn(['set', 'add', 'subtract']).withMessage('Operation must be set, add, or subtract')
  ],
  validationMiddleware,
  bookController.updateStock
)

// Lấy thống kê sách (Admin only)
router.get(
  '/statistics',
  authenticate,
  authorizeRoles('admin', 'staff'),
  bookController.getBookStatistics
)

export default router