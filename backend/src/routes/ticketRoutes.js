import express from 'express'
import { body, query } from 'express-validator'
import { authenticate, authorize } from '~/middlewares/authMiddleware'
import { validationMiddleware } from '~/middlewares/validationMiddleware'
import ticketController from '~/controllers/ticketController'

/**
 * Ticket Routes - Định nghĩa các endpoint cho support tickets
 */

const router = express.Router()

/**
 * All routes require authentication
 */
router.use(authenticate)

/**
 * User routes
 */

// Tạo ticket mới
router.post(
  '/',
  [
    body('subject').notEmpty().withMessage('Subject is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').isIn([
      'order_issue', 'payment_problem', 'shipping_delay', 'product_question',
      'return_refund', 'account_issue', 'technical_support', 'complaint', 'suggestion', 'other'
    ]).withMessage('Invalid category'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('attachments').optional().isArray().withMessage('Attachments must be an array')
  ],
  validationMiddleware,
  ticketController.createTicket
)

// Lấy tickets của user
router.get(
  '/my-tickets',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['open', 'in_progress', 'waiting_customer', 'waiting_support', 'resolved', 'closed']).withMessage('Invalid status'),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    query('category').optional().isIn([
      'order_issue', 'payment_problem', 'shipping_delay', 'product_question',
      'return_refund', 'account_issue', 'technical_support', 'complaint', 'suggestion', 'other'
    ]).withMessage('Invalid category'),
    query('sortBy').optional().isIn(['createdAt', 'lastActivityAt', 'priority', 'status']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  validationMiddleware,
  ticketController.getMyTickets
)

// Lấy ticket theo ID
router.get(
  '/:id',
  ticketController.getTicketById
)

// Cập nhật ticket
router.put(
  '/:id',
  [
    body('subject').optional().notEmpty().withMessage('Subject cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('category').optional().isIn([
      'order_issue', 'payment_problem', 'shipping_delay', 'product_question',
      'return_refund', 'account_issue', 'technical_support', 'complaint', 'suggestion', 'other'
    ]).withMessage('Invalid category'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('status').optional().isIn(['open', 'in_progress', 'waiting_customer', 'waiting_support', 'resolved', 'closed']).withMessage('Invalid status'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
  ],
  validationMiddleware,
  ticketController.updateTicket
)

// Thêm message vào ticket
router.post(
  '/:id/messages',
  [
    body('message').notEmpty().withMessage('Message is required'),
    body('messageType').optional().isIn(['user_message', 'support_response', 'system_note', 'status_change']).withMessage('Invalid message type'),
    body('isInternal').optional().isBoolean().withMessage('isInternal must be a boolean'),
    body('attachments').optional().isArray().withMessage('Attachments must be an array')
  ],
  validationMiddleware,
  ticketController.addMessage
)

// Lấy messages của ticket
router.get(
  '/:id/messages',
  ticketController.getTicketMessages
)

/**
 * Admin routes (cần quyền admin)
 */

// Lấy tất cả tickets (Admin only)
router.get(
  '/',
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term must not exceed 100 characters'),
    query('status').optional().isIn(['open', 'in_progress', 'waiting_customer', 'waiting_support', 'resolved', 'closed']).withMessage('Invalid status'),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    query('category').optional().isIn([
      'order_issue', 'payment_problem', 'shipping_delay', 'product_question',
      'return_refund', 'account_issue', 'technical_support', 'complaint', 'suggestion', 'other'
    ]).withMessage('Invalid category'),
    query('assignedTo').optional().isMongoId().withMessage('Assigned to must be a valid MongoDB ObjectId'),
    query('userId').optional().isMongoId().withMessage('User ID must be a valid MongoDB ObjectId'),
    query('sortBy').optional().isIn(['createdAt', 'lastActivityAt', 'priority', 'status']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  validationMiddleware,
  ticketController.getTickets
)

// Lấy tickets được assign (Admin only)
router.get(
  '/assigned',
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['open', 'in_progress', 'waiting_customer', 'waiting_support', 'resolved', 'closed']).withMessage('Invalid status'),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    query('sortBy').optional().isIn(['createdAt', 'lastActivityAt', 'priority', 'status']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  validationMiddleware,
  ticketController.getAssignedTickets
)

// Assign ticket (Admin only)
router.put(
  '/:id/assign',
  authorize('admin'),
  [
    body('assignedTo').isMongoId().withMessage('Assigned to must be a valid MongoDB ObjectId')
  ],
  validationMiddleware,
  ticketController.assignTicket
)

// Resolve ticket (Admin only)
router.put(
  '/:id/resolve',
  authorize('admin'),
  [
    body('resolution').notEmpty().withMessage('Resolution is required')
  ],
  validationMiddleware,
  ticketController.resolveTicket
)

// Close ticket (Admin only)
router.put(
  '/:id/close',
  authorize('admin'),
  ticketController.closeTicket
)

// Lấy thống kê tickets (Admin only)
router.get(
  '/stats',
  authorize('admin'),
  ticketController.getTicketStats
)

// Lấy tickets overdue (Admin only)
router.get(
  '/overdue',
  authorize('admin'),
  ticketController.getOverdueTickets
)

export default router
