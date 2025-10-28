import express from 'express'
import messageController from '~/controllers/messageController'
import { authenticate, authorize } from '~/middlewares/authMiddleware'
import { authorizeRoles } from '~/middlewares/authorizeRoles'
import { uploadMiddleware } from '~/middlewares/uploadMiddleware'
import { validateMessage } from '~/middlewares/validationMiddleware'

const router = express.Router()

/**
 * Message Routes - API endpoints cho hệ thống chat
 * Tất cả routes đều yêu cầu authentication
 */

// Middleware authentication cho tất cả routes
router.use(authenticate)

/**
 * @route   POST /api/messages
 * @desc    Gửi tin nhắn mới
 * @access  Private
 */
router.post(
  '/',
  validateMessage.sendMessage,
  messageController.sendMessage
)

/**
 * @route   GET /api/messages/chat/:userId
 * @desc    Lấy tin nhắn giữa 2 user
 * @access  Private
 */
router.get(
  '/chat/:userId',
  messageController.getMessagesBetweenUsers
)

/**
 * @route   GET /api/messages/conversation/:conversationId
 * @desc    Lấy tin nhắn theo conversation ID
 * @access  Private
 */
router.get(
  '/conversation/:conversationId',
  messageController.getMessagesByConversation
)

/**
 * @route   GET /api/messages/unread
 * @desc    Lấy tin nhắn chưa đọc
 * @access  Private
 */
router.get(
  '/unread',
  messageController.getUnreadMessages
)

/**
 * @route   GET /api/messages/conversations
 * @desc    Lấy danh sách conversation
 * @access  Private
 */
router.get(
  '/conversations',
  messageController.getConversations
)

/**
 * @route   GET /api/messages/admin/conversations
 * @desc    Lấy tất cả conversations (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/admin/conversations',
  authorizeRoles('admin', 'staff'),
  messageController.getAllConversations
)

/**
 * @route   GET /api/messages/search
 * @desc    Tìm kiếm tin nhắn
 * @access  Private
 */
router.get(
  '/search',
  messageController.searchMessages
)

/**
 * @route   GET /api/messages/pinned
 * @desc    Lấy tin nhắn đã ghim
 * @access  Private
 */
router.get(
  '/pinned',
  messageController.getPinnedMessages
)

/**
 * @route   PUT /api/messages/:messageId/read
 * @desc    Đánh dấu tin nhắn đã đọc
 * @access  Private
 */
router.put(
  '/:messageId/read',
  messageController.markAsRead
)

/**
 * @route   PUT /api/messages/chat/:userId/read-all
 * @desc    Đánh dấu tất cả tin nhắn giữa 2 user đã đọc
 * @access  Private
 */
router.put(
  '/chat/:userId/read-all',
  messageController.markAllAsReadBetweenUsers
)

/**
 * @route   PUT /api/messages/:messageId/important
 * @desc    Đánh dấu tin nhắn quan trọng
 * @access  Private
 */
router.put(
  '/:messageId/important',
  validateMessage.markAsImportant,
  messageController.markAsImportant
)

/**
 * @route   PUT /api/messages/:messageId/pin
 * @desc    Ghim tin nhắn
 * @access  Private
 */
router.put(
  '/:messageId/pin',
  validateMessage.pinMessage,
  messageController.pinMessage
)

/**
 * @route   PUT /api/messages/:messageId/restore
 * @desc    Khôi phục tin nhắn đã xóa
 * @access  Private
 */
router.put(
  '/:messageId/restore',
  messageController.restoreMessage
)

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Xóa tin nhắn (soft delete)
 * @access  Private
 */
router.delete(
  '/:messageId',
  messageController.deleteMessage
)

/**
 * @route   POST /api/messages/upload
 * @desc    Upload file đính kèm
 * @access  Private
 */
router.post(
  '/upload',
  uploadMiddleware.single('attachment'),
  messageController.uploadAttachment
)

/**
 * @route   GET /api/messages
 * @desc    Lấy tất cả tin nhắn (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/',
  authorizeRoles('admin', 'staff'),
  messageController.getAllMessages
)

/**
 * @route   GET /api/messages/statistics
 * @desc    Lấy thống kê tin nhắn (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/statistics',
  authorizeRoles('admin', 'staff'),
  messageController.getMessageStatistics
)

export default router
