import express from 'express'
import chatController from '~/controllers/chatController'
import { authenticate, authorize } from '~/middlewares/authMiddleware'
import { authorizeRoles } from '~/middlewares/authorizeRoles'
import { uploadMiddleware } from '~/middlewares/uploadMiddleware'
import uploadController from '~/controllers/uploadController'

const router = express.Router()

/**
 * Chat Routes - API endpoints cho hệ thống chat
 * Tất cả routes đều yêu cầu authentication
 */

// Middleware authentication cho tất cả routes
router.use(authenticate)

/**
 * @route   POST /api/messages
 * @desc    Gửi tin nhắn mới
 * @access  Private
 * @body    { fromId, toId, content, messageType? }
 */
router.post(
  '/messages',
  chatController.sendMessage
)

/**
 * @route   GET /api/admin/chats
 * @desc    Lấy danh sách toàn bộ hội thoại giữa admin và các user
 * @access  Private (Admin only)
 * @query   page?, limit?
 */
router.get(
  '/admin/chats',
  authorizeRoles('admin', 'staff'),
  chatController.getAllConversations
)

/**
 * @route   GET /api/chat/conversation
 * @desc    Tạo hoặc lấy conversation cho user
 * @access  Private
 */
router.get(
  '/conversation',
  chatController.getOrCreateConversation
)

/**
 * @route   GET /api/chat/messages
 * @desc    Lấy tin nhắn cho user theo conversationId
 * @access  Private
 * @query   conversationId, page?, limit?
 */
router.get(
  '/messages',
  chatController.getUserMessages
)

/**
 * @route   POST /api/chat/upload-image
 * @desc    Upload ảnh cho chat
 * @access  Private
 * @body    FormData với field 'image'
 */
router.post(
  '/upload-image',
  uploadMiddleware.single('image'),
  uploadController.uploadImage
)

/**
 * @route   GET /api/admin/chats/:conversationId
 * @desc    Lấy tin nhắn theo conversationId
 * @access  Private (Admin only)
 * @params  conversationId
 * @query   page?, limit?
 */
router.get(
  '/admin/chats/:conversationId',
  authorizeRoles('admin', 'staff'),
  chatController.getConversationMessages
)

export default router