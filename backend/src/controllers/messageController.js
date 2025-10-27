import { StatusCodes } from 'http-status-codes'
import messageService from '~/services/messageService'
import { asyncHandler } from '~/utils/asyncHandler'
import { ApiResponse } from '~/utils/ApiResponse'
import { AppError } from '~/utils/AppError'

/**
 * Message Controller - Xử lý các request liên quan đến tin nhắn chat
 * Hỗ trợ chat chăm sóc khách hàng với khả năng lưu trữ và truy xuất
 */

class MessageController {
  /**
   * Lấy tất cả tin nhắn (Admin only)
   * GET /api/messages
   */
  getAllMessages = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const messages = await messageService.getAllMessages({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sortBy,
      sortOrder
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, messages, 'All messages retrieved successfully')
    )
  })

  /**
   * Gửi tin nhắn mới
   * POST /api/messages
   */
  sendMessage = asyncHandler(async (req, res) => {
    const { toId, content, attachments = [] } = req.body
    const fromId = req.user._id

    const messageData = {
      fromId,
      toId,
      content,
      attachments
    }

    const message = await messageService.createMessage(messageData)

    // Emit real-time message qua Socket.io
    req.io.to(`user:${toId}`).emit('new_message', {
      id: message._id,
      fromId: message.fromId,
      toId: message.toId,
      content: message.content,
      status: message.status,
      createdAt: message.createdAt
    })

    res.status(StatusCodes.CREATED).json(
      new ApiResponse(StatusCodes.CREATED, message, 'Message sent successfully')
    )
  })

  /**
   * Lấy tin nhắn giữa 2 user
   * GET /api/messages/chat/:userId
   */
  getMessagesBetweenUsers = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const currentUserId = req.user._id
    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const messages = await messageService.getMessagesBetweenUsers(currentUserId, userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, messages, 'Messages retrieved successfully')
    )
  })

  /**
   * Lấy tin nhắn theo conversation ID
   * GET /api/messages/conversation/:conversationId
   */
  getMessagesByConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params
    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const messages = await messageService.getMessagesByConversation(conversationId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, messages, 'Conversation messages retrieved successfully')
    )
  })


  /**
   * Lấy tin nhắn chưa đọc
   * GET /api/messages/unread
   */
  getUnreadMessages = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const unreadMessages = await messageService.getUnreadMessages(userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, unreadMessages, 'Unread messages retrieved successfully')
    )
  })

  /**
   * Đánh dấu tin nhắn đã đọc
   * PUT /api/messages/:messageId/read
   */
  markAsRead = asyncHandler(async (req, res) => {
    const { messageId } = req.params
    const userId = req.user._id

    const message = await messageService.markAsRead(messageId, userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, message, 'Message marked as read')
    )
  })

  /**
   * Đánh dấu tất cả tin nhắn giữa 2 user đã đọc
   * PUT /api/messages/chat/:userId/read-all
   */
  markAllAsReadBetweenUsers = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const currentUserId = req.user._id

    const result = await messageService.markAllAsReadBetweenUsers(currentUserId, userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'All messages marked as read')
    )
  })

  /**
   * Tìm kiếm tin nhắn
   * GET /api/messages/search
   */
  searchMessages = asyncHandler(async (req, res) => {
    const { q, page = 1, limit = 20, dateFrom, dateTo } = req.query
    const userId = req.user._id

    if (!q) {
      throw new AppError('Search query is required', StatusCodes.BAD_REQUEST)
    }

    const messages = await messageService.searchMessages(q, {
      page: parseInt(page),
      limit: parseInt(limit),
      dateFrom,
      dateTo,
      userId // Chỉ tìm trong tin nhắn của user hiện tại
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, messages, 'Search results retrieved successfully')
    )
  })

  /**
   * Lấy danh sách conversation
   * GET /api/messages/conversations
   */
  getConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const { page = 1, limit = 20 } = req.query

    const conversations = await messageService.getConversations(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, conversations, 'Conversations retrieved successfully')
    )
  })

  /**
   * Lấy tất cả conversations (Admin only)
   * GET /api/messages/admin/conversations
   */
  getAllConversations = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search } = req.query

    const conversations = await messageService.getAllConversations({
      page: parseInt(page),
      limit: parseInt(limit),
      search
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, conversations, 'All conversations retrieved successfully')
    )
  })

  /**
   * Lấy thống kê tin nhắn (Admin only)
   * GET /api/messages/statistics
   */
  getMessageStatistics = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo, conversationId, senderId } = req.query

    const statistics = await messageService.getMessageStats({
      dateFrom,
      dateTo,
      conversationId,
      senderId
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, statistics, 'Message statistics retrieved successfully')
    )
  })

  /**
   * Xóa tin nhắn (soft delete)
   * DELETE /api/messages/:messageId
   */
  deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params
    const userId = req.user._id

    const message = await messageService.deleteMessage(messageId, userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, message, 'Message deleted successfully')
    )
  })

  /**
   * Khôi phục tin nhắn đã xóa
   * PUT /api/messages/:messageId/restore
   */
  restoreMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params
    const userId = req.user._id

    const message = await messageService.restoreMessage(messageId, userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, message, 'Message restored successfully')
    )
  })

  /**
   * Đánh dấu tin nhắn quan trọng
   * PUT /api/messages/:messageId/important
   */
  markAsImportant = asyncHandler(async (req, res) => {
    const { messageId } = req.params
    const { isImportant } = req.body
    const userId = req.user._id

    const message = await messageService.markAsImportant(messageId, isImportant, userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, message, 'Message importance updated')
    )
  })

  /**
   * Ghim tin nhắn
   * PUT /api/messages/:messageId/pin
   */
  pinMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params
    const { isPinned } = req.body
    const userId = req.user._id

    const message = await messageService.pinMessage(messageId, isPinned, userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, message, 'Message pin status updated')
    )
  })

  /**
   * Lấy tin nhắn đã ghim
   * GET /api/messages/pinned
   */
  getPinnedMessages = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const { conversationId } = req.query

    const pinnedMessages = await messageService.getPinnedMessages(userId, conversationId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, pinnedMessages, 'Pinned messages retrieved successfully')
    )
  })

  /**
   * Upload file đính kèm
   * POST /api/messages/upload
   */
  uploadAttachment = asyncHandler(async (req, res) => {
    const file = req.file
    const userId = req.user._id

    if (!file) {
      throw new AppError('No file provided', StatusCodes.BAD_REQUEST)
    }

    const attachment = await messageService.uploadAttachment(file, userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, attachment, 'File uploaded successfully')
    )
  })
}

export default new MessageController()
