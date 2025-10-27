import { StatusCodes } from 'http-status-codes'
import Message from '~/models/messageModel'
import User from '~/models/userModel'
import Role from '~/models/roleModel'
import { asyncHandler } from '~/utils/asyncHandler'
import { ApiResponse } from '~/utils/ApiResponse'
import { AppError } from '~/utils/AppError'

/**
 * Chat Controller - Xử lý các request liên quan đến chat
 * Hỗ trợ gửi tin nhắn và lấy danh sách hội thoại
 */
class ChatController {
  /**
   * Gửi tin nhắn mới
   * POST /api/messages
   */
  sendMessage = asyncHandler(async (req, res) => {
    try {
      const { fromId, toId, content, messageType = 'text' } = req.body

      // Validate required fields
      if (!fromId || !toId || !content) {
        throw new AppError('fromId, toId và content là bắt buộc', StatusCodes.BAD_REQUEST)
      }

      // Kiểm tra user tồn tại
      const sender = await User.findById(fromId)
      const receiver = await User.findById(toId)

      if (!sender || !receiver) {
        throw new AppError('Người gửi hoặc người nhận không tồn tại', StatusCodes.NOT_FOUND)
      }

      // Tạo conversationId theo quy tắc
      const conversationId = [fromId.toString(), toId.toString()].sort().join('_')

      // Tạo tin nhắn mới
      const message = await Message.create({
        conversationId,
        fromId,
        toId,
        content,
        messageType,
        isRead: false,
        isDeleted: false
      })

      // Populate thông tin sender và receiver
      await message.populate([
        { path: 'fromId', select: 'name email' },
        { path: 'toId', select: 'name email' }
      ])

      res.status(StatusCodes.CREATED).json(
        new ApiResponse(StatusCodes.CREATED, { message }, 'Message sent successfully')
      )
    } catch (error) {
      throw new AppError(`Failed to send message: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR)
    }
  })

  /**
   * Lấy danh sách toàn bộ hội thoại giữa admin và các user
   * GET /api/admin/chats
   */
  getAllConversations = asyncHandler(async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query
      const skip = (page - 1) * limit

      // Lấy admin role ID trước
      const adminRole = await Role.findOne({ name: 'admin' })
      if (!adminRole) {
        throw new AppError('Admin role not found', StatusCodes.NOT_FOUND)
      }

      // Lấy tất cả messages và group theo conversationId
      const conversations = await Message.aggregate([
        {
          $match: {
            isDeleted: false
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'fromId',
            foreignField: '_id',
            as: 'sender'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'toId',
            foreignField: '_id',
            as: 'receiver'
          }
        },
        {
          $unwind: '$sender'
        },
        {
          $unwind: '$receiver'
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: '$conversationId',
            messages: {
              $push: {
                sender: {
                  $cond: [
                    { $eq: ['$sender.roleId', adminRole._id] },
                    'admin',
                    'user'
                  ]
                },
                text: '$content',
                timestamp: '$createdAt',
                messageId: '$_id',
                isRead: '$isRead'
              }
            },
            lastMessage: { $first: '$$ROOT' },
            user: {
              $first: {
                $cond: [
                  { $eq: ['$sender.roleId', adminRole._id] },
                  '$receiver',
                  '$sender'
                ]
              }
            }
          }
        },
        {
          $project: {
            conversationId: '$_id',
            user: {
              userId: '$user._id',
              name: '$user.name',
              email: '$user.email'
            },
            messages: {
              $slice: ['$messages', 50] // Giới hạn 50 tin nhắn gần nhất
            },
            lastMessageTime: '$lastMessage.createdAt',
            unreadCount: {
              $sum: {
                $cond: [
                  { $eq: ['$messages.isRead', false] },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $sort: { lastMessageTime: -1 }
        },
        {
          $skip: skip
        },
        {
          $limit: parseInt(limit)
        }
      ])

      // Đếm tổng số conversations
      const totalConversations = await Message.aggregate([
        {
          $match: {
            isDeleted: false
          }
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

      const total = totalConversations[0]?.total || 0

      res.status(StatusCodes.OK).json(
        new ApiResponse(StatusCodes.OK, {
          conversations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalConversations: total,
            pages: Math.ceil(total / limit)
          }
        }, 'All conversations retrieved successfully')
      )
    } catch (error) {
      throw new AppError(`Failed to get conversations: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR)
    }
  })

  /**
   * Lấy tin nhắn theo conversationId
   * GET /api/admin/chats/:conversationId
   */
  getConversationMessages = asyncHandler(async (req, res) => {
    try {
      const { conversationId } = req.params
      const { page = 1, limit = 50 } = req.query
      const skip = (page - 1) * limit

      const messages = await Message.find({
        conversationId,
        isDeleted: false
      })
        .populate('fromId', 'name email')
        .populate('toId', 'name email')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit))

      const total = await Message.countDocuments({
        conversationId,
        isDeleted: false
      })

      // Format messages theo yêu cầu
      const formattedMessages = messages.map(msg => ({
        sender: msg.fromId.name === 'Admin User' ? 'admin' : 'user',
        text: msg.content,
        timestamp: msg.createdAt,
        messageId: msg._id,
        isRead: msg.isRead,
        messageType: msg.messageType || 'text',
        imageUrl: msg.imageUrl || null
      }))

      res.status(StatusCodes.OK).json(
        new ApiResponse(StatusCodes.OK, {
          conversationId,
          messages: formattedMessages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }, 'Conversation messages retrieved successfully')
      )
    } catch (error) {
      throw new AppError(`Failed to get conversation messages: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR)
    }
  })

  /**
   * Tạo hoặc lấy conversation cho user
   * GET /api/chat/conversation
   */
  getOrCreateConversation = asyncHandler(async (req, res) => {
    try {
      const userId = req.user._id
      
      // Lấy admin user ID
      const adminRole = await Role.findOne({ name: 'admin' })
      if (!adminRole) {
        throw new AppError('Admin role not found', StatusCodes.NOT_FOUND)
      }
      
      const adminUser = await User.findOne({ roleId: adminRole._id })
      if (!adminUser) {
        throw new AppError('Admin user not found', StatusCodes.NOT_FOUND)
      }
      
      // Generate conversation ID
      const sortedIds = [userId.toString(), adminUser._id.toString()].sort()
      const conversationId = `${sortedIds[0]}_${sortedIds[1]}`
      
      // Kiểm tra xem conversation đã tồn tại chưa
      const existingConversation = await Message.findOne({ conversationId })
      
      if (existingConversation) {
        // Conversation đã tồn tại, trả về thông tin
        res.status(StatusCodes.OK).json(
          new ApiResponse(StatusCodes.OK, {
            conversationId,
            adminUser: {
              userId: adminUser._id,
              name: adminUser.name,
              email: adminUser.email
            }
          }, 'Conversation retrieved successfully')
        )
      } else {
        // Tạo conversation mới bằng cách tạo tin nhắn đầu tiên
        const welcomeMessage = await Message.create({
          conversationId,
          fromId: adminUser._id,
          toId: userId,
          content: 'Xin chào! Tôi có thể giúp gì cho bạn?',
          messageType: 'text',
          isRead: false
        })
        
        res.status(StatusCodes.CREATED).json(
          new ApiResponse(StatusCodes.CREATED, {
            conversationId,
            adminUser: {
              userId: adminUser._id,
              name: adminUser.name,
              email: adminUser.email
            },
            welcomeMessage: {
              messageId: welcomeMessage._id,
              content: welcomeMessage.content,
              timestamp: welcomeMessage.createdAt
            }
          }, 'Conversation created successfully')
        )
      }
    } catch (error) {
      throw new AppError(`Failed to get or create conversation: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR)
    }
  })

  /**
   * Lấy tin nhắn cho user theo conversationId
   * GET /api/chat/messages
   */
  getUserMessages = asyncHandler(async (req, res) => {
    try {
      const { conversationId } = req.query
      const { page = 1, limit = 50 } = req.query
      const skip = (page - 1) * limit

      if (!conversationId) {
        throw new AppError('Conversation ID is required', StatusCodes.BAD_REQUEST)
      }

      if (!req.user || !req.user._id) {
        throw new AppError('User authentication required', StatusCodes.UNAUTHORIZED)
      }

      const messages = await Message.find({ 
        conversationId, 
        isDeleted: false 
      })
        .populate('fromId', 'name email avatar')
        .populate('toId', 'name email avatar')
        .sort({ createdAt: 1 }) // Ascending order for chat history
        .skip(skip)
        .limit(parseInt(limit))


      const formattedMessages = messages.map((msg) => {
        try {
          
          return {
            messageId: msg._id,
            sender: msg.fromId && msg.fromId._id.toString() === req.user._id.toString() ? 'user' : 'admin',
            text: msg.content,
            timestamp: msg.createdAt,
            isRead: msg.isRead,
            messageType: msg.messageType,
            imageUrl: msg.imageUrl,
            fromUser: msg.fromId ? {
              userId: msg.fromId._id,
              name: msg.fromId.name,
              email: msg.fromId.email,
              avatar: msg.fromId.avatar
            } : null,
            toUser: msg.toId ? {
              userId: msg.toId._id,
              name: msg.toId.name,
              email: msg.toId.email,
              avatar: msg.toId.avatar
            } : null
          }
        } catch (error) {
          console.error(`❌ Error processing message ${index}:`, error)
          throw error
        }
      })

      const totalMessages = await Message.countDocuments({ 
        conversationId, 
        isDeleted: false 
      })

      res.status(StatusCodes.OK).json(
        new ApiResponse(StatusCodes.OK, {
          messages: formattedMessages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalMessages,
            pages: Math.ceil(totalMessages / parseInt(limit))
          }
        }, 'User messages retrieved successfully')
      )
    } catch (error) {
      throw new AppError(`Failed to get user messages: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR)
    }
  })
}

export default new ChatController()