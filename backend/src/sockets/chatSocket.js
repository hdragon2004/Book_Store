import jwt from 'jsonwebtoken'
import { config } from '~/config/environment'
import User from '~/models/userModel'
import Message from '~/models/messageModel'
import Role from '~/models/roleModel'

const setupChatSocket = (io) => {
  // Middleware xác thực JWT cho Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'))
      }

      const decoded = jwt.verify(token, config.JWT_SECRET)
      const user = await User.findById(decoded._id).populate('roleId', 'name')
      
      if (!user) {
        return next(new Error('Authentication error: User not found'))
      }

      socket.userId = user._id.toString()
      socket.user = user
      next()
    } catch (error) {
      next(new Error('Authentication error: Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.name} (${socket.userId})`)

    // Join user room để có thể gửi tin nhắn trực tiếp
    socket.join(socket.userId.toString())

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      console.log('🔌 User joining conversation:', conversationId, 'User:', socket.user.name)
      socket.join(conversationId)
      
      // Emit user joined event
      socket.to(conversationId).emit('user_joined', {
        userId: socket.userId,
        userName: socket.user.name,
        timestamp: new Date()
      })
    })

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId)
      console.log(`👋 User ${socket.user.name} left conversation: ${conversationId}`)
      
      // Emit user left event
      socket.to(conversationId).emit('user_left', {
        userId: socket.userId,
        userName: socket.user.name,
        timestamp: new Date()
      })
    })

    // Handle new message - simplified version with middleware handling toId
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, messageType = 'text', imageUrl } = data

        console.log('📤 Creating message with data:', {
          conversationId,
          fromId: socket.userId,
          content,
          messageType,
          imageUrl
        })

        // Tạo tin nhắn mới - middleware sẽ tự động xác định toId
        const message = await Message.create({
          conversationId,
          fromId: socket.userId,
          content,
          messageType,
          imageUrl: imageUrl || null,
          isRead: false,
          isDeleted: false
        })
        
        console.log('✅ Message created successfully:', {
          messageId: message._id,
          fromId: message.fromId,
          toId: message.toId,
          conversationId: message.conversationId
        })

        // Populate để có đầy đủ thông tin
        await message.populate('fromId', 'name email avatar')
        await message.populate('toId', 'name email avatar')
        
        console.log('✅ Message populated:', {
          fromUser: message.fromId?.name,
          toUser: message.toId?.name
        })

        // Format message cho frontend
        const senderRole = socket.user.roleId.name
        const formattedMessage = {
          messageId: message._id,
          sender: senderRole === 'admin' ? 'admin' : senderRole === 'staff' ? 'staff' : 'user',
          text: message.content,
          timestamp: message.createdAt,
          isRead: message.isRead,
          messageType: message.messageType,
          imageUrl: message.imageUrl,
          fromUser: {
            userId: message.fromId._id,
            name: message.fromId.name,
            email: message.fromId.email,
            avatar: message.fromId.avatar
          },
          toUser: message.toId ? {
            userId: message.toId._id,
            name: message.toId.name,
            email: message.toId.email,
            avatar: message.toId.avatar
          } : null
        }

        console.log('📤 Formatted message for frontend:', {
          messageId: formattedMessage.messageId,
          sender: formattedMessage.sender,
          fromUser: formattedMessage.fromUser?.name,
          toUser: formattedMessage.toUser?.name,
          content: formattedMessage.text
        })

        // Emit tin nhắn đến tất cả users trong conversation
        console.log('📤 Emitting message to conversation:', conversationId, 'Message type:', messageType, 'ImageUrl:', imageUrl)
        console.log('📤 Formatted message:', formattedMessage)
        console.log('📤 Sender role:', socket.user.roleId.name)
        
        io.to(conversationId).emit('new_message', {
          message: formattedMessage,
          conversationId
        })

      } catch (error) {
        console.error('❌ Error sending message:', error)
        
        // Send specific error message to client
        socket.emit('message_error', {
          error: 'Failed to send message',
          details: error.message,
          type: 'validation_error'
        })
        
        // Log detailed error for debugging
        console.error('❌ Message creation failed:', {
          conversationId: data.conversationId,
          fromId: socket.userId,
          error: error.message,
          stack: error.stack
        })
      }
    })

    // Handle typing indicator
    socket.on('typing_start', (data) => {
      const { conversationId } = data
      socket.to(conversationId).emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.name,
        isTyping: true
      })
    })

    socket.on('typing_stop', (data) => {
      const { conversationId } = data
      socket.to(conversationId).emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.name,
        isTyping: false
      })
    })

    // Handle message read
    socket.on('mark_message_read', async (data) => {
      try {
        const { messageId, conversationId } = data
        
        await Message.markAsRead(messageId, socket.userId)
        
        // Emit read receipt
        socket.to(conversationId).emit('message_read', {
          messageId,
          userId: socket.userId,
          timestamp: new Date()
        })
      } catch (error) {
        console.error('Error marking message as read:', error)
      }
    })

    // Handle conversation read
    socket.on('mark_conversation_read', async (data) => {
      try {
        const { conversationId } = data
        
        await Message.markConversationAsRead(conversationId, socket.userId)
        
        // Emit conversation read
        socket.to(conversationId).emit('conversation_read', {
          conversationId,
          userId: socket.userId,
          timestamp: new Date()
        })
      } catch (error) {
        console.error('Error marking conversation as read:', error)
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.name} (${socket.userId})`)
    })
  })

  return io
}

export default setupChatSocket
