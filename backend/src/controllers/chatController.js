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

      // Lấy admin và staff role ID trước
      const adminRole = await Role.findOne({ name: 'admin' })
      const staffRole = await Role.findOne({ name: 'staff' })
      if (!adminRole) {
        throw new AppError('Admin role not found', StatusCodes.NOT_FOUND)
      }

      const adminRoleId = adminRole._id
      const staffRoleId = staffRole ? staffRole._id : null

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
                    { $eq: ['$sender.roleId', adminRoleId] },
                    'admin',
                    {
                      $cond: [
                        { $eq: [{ $ifNull: ['$sender.roleId', null] }, staffRoleId] },
                        'staff',
                        'user'
                      ]
                    }
                  ]
                },
                text: '$content',
                timestamp: '$createdAt',
                messageId: '$_id',
                isRead: '$isRead'
              }
            },
            lastMessage: { $first: '$$ROOT' },
            // Lưu tất cả user IDs trong conversation để xác định user (không phải admin/staff)
            senderIds: { $addToSet: '$sender._id' },
            receiverIds: { $addToSet: '$receiver._id' },
            senders: { $addToSet: '$sender' },
            receivers: { $addToSet: '$receiver' }
          }
        },
        {
          $project: {
            conversationId: '$_id',
            lastMessage: 1,
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
            },
            // Tìm user thực sự (không phải admin/staff) từ senders hoặc receivers
            allUsers: {
              $setUnion: ['$senders', '$receivers']
            }
          }
        },
        {
          $project: {
            conversationId: 1,
            messages: 1,
            lastMessageTime: 1,
            unreadCount: 1,
            // Tìm user đầu tiên không phải admin/staff
            user: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$allUsers',
                    as: 'u',
                    cond: {
                      $and: [
                        { $ne: ['$$u.roleId', adminRoleId] },
                        {
                          $cond: [
                            { $ne: [{ $ifNull: [staffRoleId, null] }, null] },
                            { $ne: ['$$u.roleId', staffRoleId] },
                            true
                          ]
                        }
                      ]
                    }
                  }
                },
                0
              ]
            }
          }
        },
        {
          $project: {
            conversationId: 1,
            user: {
              userId: '$user._id',
              name: '$user.name',
              email: '$user.email',
              avatar: '$user.avatar'
            },
            messages: 1,
            lastMessageTime: 1,
            unreadCount: 1
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

      // Xử lý lại conversations để đảm bảo user được xác định đúng
      // Nếu user không được tìm thấy từ aggregation, tìm từ conversationId
      const processedConversations = await Promise.all(
        conversations.map(async (conv) => {
          // Nếu user đã có và hợp lệ, giữ nguyên
          if (conv.user && conv.user.userId && conv.user.name) {
            return conv
          }

          // Nếu không, parse conversationId để lấy user IDs
          // conversationId format: "userId1_userId2" (sorted)
          const userIds = conv.conversationId.split('_').filter(id => id)
          
          // Tìm user không phải admin/staff từ conversationId
          let foundUser = null
          for (const userId of userIds) {
            try {
              const user = await User.findById(userId).populate('roleId', 'name')
              if (user) {
                const roleName = user.roleId?.name || 'user'
                // Nếu không phải admin/staff, đây là user ta cần
                if (roleName !== 'admin' && roleName !== 'staff') {
                  foundUser = {
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar
                  }
                  break
                }
              }
            } catch (error) {
              console.error(`Error finding user ${userId}:`, error)
            }
          }

          // Nếu vẫn không tìm thấy, lấy user đầu tiên (fallback)
          if (!foundUser && userIds.length > 0) {
            try {
              const user = await User.findById(userIds[0]).populate('roleId', 'name')
              if (user) {
                foundUser = {
                  userId: user._id,
                  name: user.name,
                  email: user.email,
                  avatar: user.avatar
                }
              }
            } catch (error) {
              console.error(`Error finding fallback user:`, error)
            }
          }

          return {
            ...conv,
            user: foundUser || conv.user
          }
        })
      )

      res.status(StatusCodes.OK).json(
        new ApiResponse(StatusCodes.OK, {
          conversations: processedConversations,
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
        .populate('fromId', 'name email avatar roleId')
        .populate('toId', 'name email avatar roleId')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit))

      const total = await Message.countDocuments({
        conversationId,
        isDeleted: false
      })

      // Lấy admin và staff role để so sánh
      const adminRole = await Role.findOne({ name: 'admin' })
      const staffRole = await Role.findOne({ name: 'staff' })
      
      if (!adminRole) {
        throw new AppError('Admin role not found', StatusCodes.NOT_FOUND)
      }
      
      // Format messages theo yêu cầu với fromUser và toUser
      const formattedMessages = messages.map(msg => {
        // Xác định sender role dựa trên roleId
        const fromRoleId = msg.fromId.roleId?.toString()
        const adminRoleId = adminRole._id.toString()
        const staffRoleId = staffRole ? staffRole._id.toString() : null
        const isAdmin = fromRoleId === adminRoleId
        const isStaff = staffRoleId && fromRoleId === staffRoleId
        
        return {
          messageId: msg._id,
          sender: isAdmin ? 'admin' : isStaff ? 'staff' : 'user',
          text: msg.content,
          timestamp: msg.createdAt,
          isRead: msg.isRead,
          messageType: msg.messageType || 'text',
          imageUrl: msg.imageUrl || null,
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
      })

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
      
      // Lấy staff user ID (ưu tiên staff, fallback admin)
      const staffRole = await Role.findOne({ name: 'staff' })
      const adminRole = await Role.findOne({ name: 'admin' })
      
      let supportUser = null
      let supportRole = null
      
      if (staffRole) {
        supportUser = await User.findOne({ roleId: staffRole._id })
        if (supportUser) {
          supportRole = 'staff'
        }
      }
      
      // Fallback to admin nếu không có staff
      if (!supportUser && adminRole) {
        supportUser = await User.findOne({ roleId: adminRole._id })
        if (supportUser) {
          supportRole = 'admin'
        }
      }
      
      if (!supportUser) {
        throw new AppError('Support user not found', StatusCodes.NOT_FOUND)
      }
      
      // Generate conversation ID
      const sortedIds = [userId.toString(), supportUser._id.toString()].sort()
      const conversationId = `${sortedIds[0]}_${sortedIds[1]}`
      
      // Kiểm tra xem conversation đã tồn tại chưa
      const existingConversation = await Message.findOne({ conversationId })
      
      if (existingConversation) {
        // Conversation đã tồn tại, trả về thông tin
        res.status(StatusCodes.OK).json(
          new ApiResponse(StatusCodes.OK, {
            conversationId,
            adminUser: supportRole === 'admin' ? {
              userId: supportUser._id,
              name: supportUser.name,
              email: supportUser.email
            } : null,
            staffUser: supportRole === 'staff' ? {
              userId: supportUser._id,
              name: supportUser.name,
              email: supportUser.email
            } : null
          }, 'Conversation retrieved successfully')
        )
      } else {
        // Tạo conversation mới bằng cách tạo tin nhắn đầu tiên
        const welcomeMessage = await Message.create({
          conversationId,
          fromId: supportUser._id,
          toId: userId,
          content: 'Xin chào! Tôi có thể giúp gì cho bạn?',
          messageType: 'text',
          isRead: false
        })
        
        res.status(StatusCodes.CREATED).json(
          new ApiResponse(StatusCodes.CREATED, {
            conversationId,
            adminUser: supportRole === 'admin' ? {
              userId: supportUser._id,
              name: supportUser.name,
              email: supportUser.email
            } : null,
            staffUser: supportRole === 'staff' ? {
              userId: supportUser._id,
              name: supportUser.name,
              email: supportUser.email
            } : null,
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