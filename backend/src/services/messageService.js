import Message from '~/models/messageModel'
import User from '~/models/userModel'
import { AppError } from '~/utils/AppError'
import path from 'path'
import fs from 'fs'

/**
 * Message Service - Business logic cho hệ thống chat
 * Xử lý tất cả logic liên quan đến tin nhắn và conversation
 */

class MessageService {
  /**
   * Lấy tất cả tin nhắn (Admin only)
   */
  async getAllMessages(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options

      const skip = (page - 1) * limit
      const sortOptions = {}
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

      let query = { isDeleted: false }

      // Thêm tìm kiếm nếu có
      if (search) {
        query.content = { $regex: search, $options: 'i' }
      }

      const messages = await Message.find(query)
        .populate('fromId', 'name email avatar roleId')
        .populate('toId', 'name email avatar roleId')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)

      const total = await Message.countDocuments(query)

      return {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      throw new AppError(`Failed to get all messages: ${error.message}`, 500)
    }
  }

  /**
   * Tạo tin nhắn mới
   */
  async createMessage(messageData) {
    try {
      const {
        fromId,
        toId,
        content,
        attachments = []
      } = messageData

      // Kiểm tra user tồn tại
      const sender = await User.findById(fromId)
      const receiver = await User.findById(toId)

      if (!sender || !receiver) {
        throw new AppError('Sender or receiver not found', 404)
      }

      // Tạo conversationId
      const conversationId = this.generateConversationId(fromId, toId)

      // Tạo tin nhắn
      const message = await Message.create({
        conversationId,
        fromId,
        toId,
        content,
        attachments
      })

      // Populate thông tin sender và receiver
      await message.populate([
        { path: 'fromId', select: 'name email avatar roleId' },
        { path: 'toId', select: 'name email avatar roleId' }
      ])

      return message
    } catch (error) {
      throw new AppError(`Failed to create message: ${error.message}`, 500)
    }
  }

  /**
   * Lấy tin nhắn theo conversation ID
   */
  async getMessagesByConversation(conversationId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options

      const messages = await Message.findByConversationId(conversationId, page, limit)
      const total = await Message.countDocuments({ 
        conversationId, 
        isDeleted: false 
      })

      return {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      throw new AppError(`Failed to get messages by conversation: ${error.message}`, 500)
    }
  }

  /**
   * Lấy tin nhắn giữa 2 user
   */
  async getMessagesBetweenUsers(fromId, toId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options

      const messages = await Message.getMessagesBetweenUsers(fromId, toId, {
        page,
        limit,
        sortBy,
        sortOrder
      })

      return {
        messages,
        pagination: {
          page,
          limit,
          total: messages.length
        }
      }
    } catch (error) {
      throw new AppError(`Failed to get messages: ${error.message}`, 500)
    }
  }

  /**
   * Lấy tin nhắn chưa đọc
   */
  async getUnreadMessages(userId) {
    try {
      const unreadMessages = await Message.getUnreadMessages(userId)
      return unreadMessages
    } catch (error) {
      throw new AppError(`Failed to get unread messages: ${error.message}`, 500)
    }
  }

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  async markAsRead(messageId, userId) {
    try {
      const message = await Message.findById(messageId)

      if (!message) {
        throw new AppError('Message not found', 404)
      }

      // Kiểm tra quyền truy cập
      if (message.toId.toString() !== userId.toString()) {
        throw new AppError('Unauthorized to mark this message as read', 403)
      }

      await message.markAsRead()
      return message
    } catch (error) {
      throw new AppError(`Failed to mark message as read: ${error.message}`, 500)
    }
  }

  /**
   * Đánh dấu tất cả tin nhắn giữa 2 user đã đọc
   */
  async markAllAsReadBetweenUsers(fromId, toId) {
    try {
      const result = await Message.markAllAsReadBetweenUsers(fromId, toId)
      return result
    } catch (error) {
      throw new AppError(`Failed to mark all messages as read: ${error.message}`, 500)
    }
  }

  /**
   * Tìm kiếm tin nhắn
   */
  async searchMessages(query, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        fromId,
        toId,
        dateFrom,
        dateTo,
        userId
      } = options

      // Thêm filter cho user nếu có
      const searchOptions = {
        page,
        limit,
        fromId,
        toId,
        dateFrom,
        dateTo
      }

      if (userId) {
        searchOptions.fromId = userId
        searchOptions.toId = userId
      }

      const messages = await Message.searchMessages(query, searchOptions)

      return {
        messages,
        pagination: {
          page,
          limit,
          total: messages.length
        }
      }
    } catch (error) {
      throw new AppError(`Failed to search messages: ${error.message}`, 500)
    }
  }

  /**
   * Lấy tất cả conversations (Admin only)
   */
  async getAllConversations(options = {}) {
    try {
      const { page = 1, limit = 20, search } = options

      // Lấy tất cả conversations với thông tin user
      const conversations = await Message.aggregate([
        {
          $match: {
            isDeleted: false
          }
        },
        {
          $group: {
            _id: '$conversationId',
            lastMessage: { $last: '$$ROOT' },
            messageCount: { $sum: 1 },
            unreadCount: {
              $sum: {
                $cond: [
                  { $eq: ['$isRead', false] },
                  1,
                  0
                ]
              }
            },
            participants: {
              $addToSet: {
                userId: '$fromId',
                role: 'sender'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'lastMessage.fromId',
            foreignField: '_id',
            as: 'sender'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'lastMessage.toId',
            foreignField: '_id',
            as: 'receiver'
          }
        },
        {
          $project: {
            conversationId: '$_id',
            lastMessage: 1,
            messageCount: 1,
            unreadCount: 1,
            sender: { $arrayElemAt: ['$sender', 0] },
            receiver: { $arrayElemAt: ['$receiver', 0] },
            updatedAt: '$lastMessage.createdAt'
          }
        },
        {
          $sort: { updatedAt: -1 }
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit
        }
      ])

      const total = await Message.aggregate([
        {
          $match: { isDeleted: false }
        },
        {
          $group: {
            _id: '$conversationId'
          }
        },
        {
          $count: 'total'
        }
      ])

      return {
        conversations,
        pagination: {
          page,
          limit,
          total: total[0]?.total || 0,
          pages: Math.ceil((total[0]?.total || 0) / limit)
        }
      }
    } catch (error) {
      throw new AppError(`Failed to get all conversations: ${error.message}`, 500)
    }
  }

  /**
   * Lấy danh sách conversation
   */
  async getConversations(userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options

      // Lấy tất cả conversation mà user tham gia
      const conversations = await Message.aggregate([
        {
          $match: {
            $or: [
              { fromId: userId },
              { toId: userId }
            ],
            isDeleted: false
          }
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$fromId', userId] },
                '$toId',
                '$fromId'
              ]
            },
            lastMessage: { $last: '$$ROOT' },
            messageCount: { $sum: 1 },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$toId', userId] },
                      { $in: ['$status', ['sent', 'delivered']] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'otherUser'
          }
        },
        {
          $project: {
            otherUserId: '$_id',
            otherUser: { $arrayElemAt: ['$otherUser', 0] },
            lastMessage: 1,
            messageCount: 1,
            unreadCount: 1,
            updatedAt: '$lastMessage.createdAt'
          }
        },
        {
          $sort: { updatedAt: -1 }
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit
        }
      ])

      return {
        conversations,
        pagination: {
          page,
          limit,
          total: conversations.length
        }
      }
    } catch (error) {
      throw new AppError(`Failed to get conversations: ${error.message}`, 500)
    }
  }

  /**
   * Lấy thống kê tin nhắn
   */
  async getMessageStats(options = {}) {
    try {
      const statistics = await Message.getMessageStats(options)
      return statistics[0] || {
        totalMessages: 0,
        unreadMessages: 0
      }
    } catch (error) {
      throw new AppError(`Failed to get message statistics: ${error.message}`, 500)
    }
  }

  /**
   * Xóa tin nhắn (soft delete)
   */
  async deleteMessage(messageId, userId) {
    try {
      const message = await Message.findById(messageId)

      if (!message) {
        throw new AppError('Message not found', 404)
      }

      // Kiểm tra quyền xóa
      if (message.fromId.toString() !== userId.toString()) {
        throw new AppError('Unauthorized to delete this message', 403)
      }

      await message.softDelete()
      return message
    } catch (error) {
      throw new AppError(`Failed to delete message: ${error.message}`, 500)
    }
  }

  /**
   * Khôi phục tin nhắn đã xóa
   */
  async restoreMessage(messageId, userId) {
    try {
      const message = await Message.findById(messageId)

      if (!message) {
        throw new AppError('Message not found', 404)
      }

      // Kiểm tra quyền khôi phục
      if (message.fromId.toString() !== userId.toString()) {
        throw new AppError('Unauthorized to restore this message', 403)
      }

      await message.restore()
      return message
    } catch (error) {
      throw new AppError(`Failed to restore message: ${error.message}`, 500)
    }
  }

  /**
   * Đánh dấu tin nhắn quan trọng
   */
  async markAsImportant(messageId, isImportant, userId) {
    try {
      const message = await Message.findById(messageId)

      if (!message) {
        throw new AppError('Message not found', 404)
      }

      // Kiểm tra quyền
      if (message.fromId.toString() !== userId.toString()) {
        throw new AppError('Unauthorized to modify this message', 403)
      }

      message.isImportant = isImportant
      await message.save()

      return message
    } catch (error) {
      throw new AppError(`Failed to mark message as important: ${error.message}`, 500)
    }
  }

  /**
   * Ghim tin nhắn
   */
  async pinMessage(messageId, isPinned, userId) {
    try {
      const message = await Message.findById(messageId)

      if (!message) {
        throw new AppError('Message not found', 404)
      }

      // Kiểm tra quyền
      if (message.fromId.toString() !== userId.toString()) {
        throw new AppError('Unauthorized to pin this message', 403)
      }

      message.isPinned = isPinned
      await message.save()

      return message
    } catch (error) {
      throw new AppError(`Failed to pin message: ${error.message}`, 500)
    }
  }

  /**
   * Lấy tin nhắn đã ghim
   */
  async getPinnedMessages(userId, conversationId = null) {
    try {
      const query = {
        isPinned: true,
        isDeleted: false,
        $or: [
          { fromId: userId },
          { toId: userId }
        ]
      }

      if (conversationId) {
        query.conversationId = conversationId
      }

      const pinnedMessages = await Message.find(query)
        .populate('fromId', 'name email avatar')
        .populate('toId', 'name email avatar')
        .sort({ createdAt: -1 })

      return pinnedMessages
    } catch (error) {
      throw new AppError(`Failed to get pinned messages: ${error.message}`, 500)
    }
  }

  /**
   * Upload file đính kèm
   */
  async uploadAttachment(file, userId) {
    try {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (!allowedTypes.includes(file.mimetype)) {
        throw new AppError('File type not allowed', 400)
      }

      if (file.size > maxSize) {
        throw new AppError('File size too large', 400)
      }

      const attachment = {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`
      }

      return attachment
    } catch (error) {
      throw new AppError(`Failed to upload attachment: ${error.message}`, 500)
    }
  }

  /**
   * Tạo conversation ID từ 2 user ID
   */
  generateConversationId(userId1, userId2) {
    // Sắp xếp ID để đảm bảo conversation ID nhất quán
    const sortedIds = [userId1.toString(), userId2.toString()].sort()
    return `conv_${sortedIds[0]}_${sortedIds[1]}`
  }

  /**
   * Lấy tin nhắn theo ID
   */
  async getMessageById(messageId) {
    try {
      const message = await Message.findById(messageId)
        .populate('fromId', 'name email avatar roleId')
        .populate('toId', 'name email avatar roleId')

      if (!message) {
        throw new AppError('Message not found', 404)
      }

      return message
    } catch (error) {
      throw new AppError(`Failed to get message: ${error.message}`, 500)
    }
  }

  /**
   * Cập nhật trạng thái tin nhắn
   */
  async updateMessageStatus(messageId, status) {
    try {
      const message = await Message.findById(messageId)

      if (!message) {
        throw new AppError('Message not found', 404)
      }

      message.status = status
      if (status === 'read') {
        message.readAt = new Date()
      }

      await message.save()
      return message
    } catch (error) {
      throw new AppError(`Failed to update message status: ${error.message}`, 500)
    }
  }

  /**
   * Lấy tin nhắn theo khoảng thời gian
   */
  async getMessagesByDateRange(userId, startDate, endDate, options = {}) {
    try {
      const { page = 1, limit = 50 } = options

      const query = {
        $or: [
          { fromId: userId },
          { toId: userId }
        ],
        isDeleted: false,
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }

      const messages = await Message.find(query)
        .populate('fromId', 'name email avatar')
        .populate('toId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)

      return {
        messages,
        pagination: {
          page,
          limit,
          total: messages.length
        }
      }
    } catch (error) {
      throw new AppError(`Failed to get messages by date range: ${error.message}`, 500)
    }
  }
}

export default new MessageService()
