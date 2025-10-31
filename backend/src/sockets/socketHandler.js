import jwt from 'jsonwebtoken'
import { config } from '~/config/environment'
import User from '~/models/userModel'

/**
 * Socket Handler - Xử lý các sự kiện Socket.io
 * Cung cấp realtime communication cho ứng dụng
 */

class SocketHandler {
  constructor(io) {
    this.io = io
    this.connectedUsers = new Map() // Map để lưu trữ user connections
    this.setupMiddleware()
    this.setupEventHandlers()
  }

  /**
   * Setup middleware để xác thực socket connections
   */
  setupMiddleware() {
    // Middleware xác thực JWT cho socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]
        
        if (!token) {
          return next(new Error('Authentication token required'))
        }

        // Verify JWT token
        const jwtSecret = config.jwtSecret || config.JWT_SECRET || process.env.JWT_SECRET
        const decoded = jwt.verify(token, jwtSecret)
        
        // Lấy thông tin user
        const user = await User.findById(decoded.userId || decoded.id).select('-password').populate('roleId')
        
        if (!user) {
          return next(new Error('User not found'))
        }

        if (!user.isActive) {
          return next(new Error('User account is deactivated'))
        }

        // Lưu user info vào socket
        socket.user = user
        next()
      } catch (error) {
        next(new Error('Invalid authentication token'))
      }
    })
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      
      // Lưu user connection
      this.connectedUsers.set(socket.user._id.toString(), {
        socketId: socket.id,
        user: socket.user,
        connectedAt: new Date()
      })

      // Join user vào room riêng của họ
      socket.join(`user:${socket.user._id}`)

      // Join admin vào admin room nếu là admin
      if (socket.user.roleId?.name === 'admin') {
        socket.join('admin')
      }

      // Event: User join room
      socket.on('join_room', (room) => {
        socket.join(room)
      })

      // Event: User leave room
      socket.on('leave_room', (room) => {
        socket.leave(room)
      })

      // Event: Send message
      socket.on('send_message', (data) => {
        this.handleSendMessage(socket, data)
      })

      // Event: Chat message (realtime)
      socket.on('chat_message', (data) => {
        this.handleChatMessage(socket, data)
      })

      // Event: Join conversation (nhận cả string conversationId hoặc object {conversationId})
      socket.on('join_conversation', (data) => {
        // Hỗ trợ cả string và object
        const conversationId = typeof data === 'string' ? data : data?.conversationId || data
        if (conversationId) {
          this.handleJoinConversation(socket, { conversationId })
        }
      })

      // Event: Leave conversation
      socket.on('leave_conversation', (data) => {
        // Hỗ trợ cả string và object
        const conversationId = typeof data === 'string' ? data : data?.conversationId || data
        if (conversationId) {
          this.handleLeaveConversation(socket, { conversationId })
        }
      })

      // Event: Send message to conversation
      // FIX: Đây là handler DUY NHẤT cho send_message event
      // Xử lý tất cả messages gửi qua socket với conversationId
      socket.on('send_message', (data) => {
        this.handleSendMessageToConversation(socket, data)
      })

      // Event: Typing in conversation
      socket.on('typing_start', (data) => {
        this.handleTypingStart(socket, data)
      })

      socket.on('typing_stop', (data) => {
        this.handleTypingStop(socket, data)
      })

      // Event: Join chat room
      socket.on('join_chat', (data) => {
        this.handleJoinChat(socket, data)
      })

      // Event: Leave chat room
      socket.on('leave_chat', (data) => {
        this.handleLeaveChat(socket, data)
      })

      // Event: Mark message as read
      socket.on('mark_message_read', (data) => {
        this.handleMarkMessageRead(socket, data)
      })

      // Event: Order status update
      socket.on('order_status_update', (data) => {
        this.handleOrderStatusUpdate(socket, data)
      })

      // Event: Stock update
      socket.on('stock_update', (data) => {
        this.handleStockUpdate(socket, data)
      })

      // Event: New review
      socket.on('new_review', (data) => {
        this.handleNewReview(socket, data)
      })

      // Event: User typing
      socket.on('typing', (data) => {
        this.handleTyping(socket, data)
      })

      // Event: User stop typing
      socket.on('stop_typing', (data) => {
        this.handleStopTyping(socket, data)
      })

      // Event: Disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket)
      })

      // Event: Get online users
      socket.on('get_online_users', () => {
        this.handleGetOnlineUsers(socket)
      })

      // Event: Send notification
      socket.on('send_notification', (data) => {
        this.handleSendNotification(socket, data)
      })
    })
  }

  /**
   * Handle send message
   */
  handleSendMessage(socket, data) {
    const { room, message, type = 'text' } = data
    
    // Broadcast message to room
    socket.to(room).emit('new_message', {
      id: Date.now(),
      userId: socket.user._id,
      userName: socket.user.name,
      message,
      type,
      timestamp: new Date()
    })
  }

  /**
   * Handle order status update
   */
  handleOrderStatusUpdate(socket, data) {
    const { orderId, status, message } = data
    
    // Emit to user's personal room
    this.io.to(`user:${socket.user._id}`).emit('order_status_updated', {
      orderId,
      status,
      message,
      timestamp: new Date()
    })

    // Emit to admin room
    this.io.to('admin').emit('order_status_updated', {
      orderId,
      status,
      message,
      userId: socket.user._id,
      timestamp: new Date()
    })
  }

  /**
   * Handle stock update
   */
  handleStockUpdate(socket, data) {
    const { bookId, bookTitle, oldStock, newStock } = data
    
    // Emit to admin room
    this.io.to('admin').emit('stock_updated', {
      bookId,
      bookTitle,
      oldStock,
      newStock,
      timestamp: new Date()
    })
  }

  /**
   * Handle new review
   */
  handleNewReview(socket, data) {
    const { bookId, bookTitle, rating, comment } = data
    
    // Emit to all users (public event)
    this.io.emit('new_review', {
      bookId,
      bookTitle,
      rating,
      comment,
      userName: socket.user.name,
      timestamp: new Date()
    })
  }

  /**
   * Handle typing
   */
  handleTyping(socket, data) {
    const { room } = data
    
    socket.to(room).emit('user_typing', {
      userId: socket.user._id,
      userName: socket.user.name
    })
  }

  /**
   * Handle stop typing
   */
  handleStopTyping(socket, data) {
    const { room } = data
    
    socket.to(room).emit('user_stop_typing', {
      userId: socket.user._id,
      userName: socket.user.name
    })
  }

  /**
   * Handle disconnect
   */
  handleDisconnect(socket) {
    // Xóa user khỏi connected users
    this.connectedUsers.delete(socket.user._id.toString())
  }

  /**
   * Handle get online users
   */
  handleGetOnlineUsers(socket) {
    const onlineUsers = Array.from(this.connectedUsers.values()).map(user => ({
      id: user.user._id,
      name: user.user.name,
      roleId: user.user.roleId,
      connectedAt: user.connectedAt
    }))

    socket.emit('online_users', onlineUsers)
  }

  /**
   * Handle send notification
   */
  handleSendNotification(socket, data) {
    const { userId, type, title, message, data: notificationData } = data
    
    // Emit to specific user
    this.io.to(`user:${userId}`).emit('notification', {
      type,
      title,
      message,
      data: notificationData,
      timestamp: new Date()
    })
  }

  /**
   * Broadcast message to all connected users
   */
  broadcastToAll(event, data) {
    this.io.emit(event, data)
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId, event, data) {
    this.io.to(`user:${userId}`).emit(event, data)
  }

  /**
   * Send message to admin users
   */
  sendToAdmin(event, data) {
    this.io.to('admin').emit(event, data)
  }

  /**
   * Send message to room
   */
  sendToRoom(room, event, data) {
    this.io.to(room).emit(event, data)
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size
  }

  /**
   * Get connected users
   */
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values())
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId.toString())
  }

  /**
   * Get user socket by user ID
   */
  getUserSocket(userId) {
    const userConnection = this.connectedUsers.get(userId.toString())
    return userConnection ? this.io.sockets.sockets.get(userConnection.socketId) : null
  }

  /**
   * Handle chat message
   */
  async handleChatMessage(socket, data) {
    try {
      const { toId, content, attachments = [] } = data
      
      if (!toId || !content) {
        socket.emit('chat_error', { message: 'Receiver ID and content are required' })
        return
      }

      // Import message service
      const messageService = (await import('~/services/messageService')).default
      
      // Tạo tin nhắn
      const messageData = {
        fromId: socket.user._id,
        toId,
        content,
        attachments
      }

      const message = await messageService.createMessage(messageData)

      // Emit tin nhắn đến receiver
      this.io.to(`user:${toId}`).emit('new_chat_message', {
        id: message._id,
        fromId: message.fromId,
        toId: message.toId,
        content: message.content,
        status: message.status,
        createdAt: message.createdAt
      })

      // Emit confirmation đến sender
      socket.emit('chat_message_sent', {
        id: message._id,
        status: 'sent',
        createdAt: message.createdAt
      })
    } catch (error) {
      console.error('❌ Chat message error:', error)
      socket.emit('chat_error', { message: 'Failed to send message' })
    }
  }

  /**
   * Handle join chat
   */
  handleJoinChat(socket, data) {
    const { userId } = data
    
    if (!userId) {
      socket.emit('chat_error', { message: 'User ID is required' })
      return
    }

    // Join user's personal chat room
    socket.join(`user:${socket.user._id}`)
    
    // Emit confirmation
    socket.emit('chat_joined', { userId })
  }

  /**
   * Handle leave chat
   */
  handleLeaveChat(socket, data) {
    const { userId } = data
    socket.emit('chat_left', { userId })
  }

  /**
   * Handle mark message as read
   */
  async handleMarkMessageRead(socket, data) {
    try {
      const { messageId } = data
      
      if (!messageId) {
        socket.emit('chat_error', { message: 'Message ID is required' })
        return
      }

      // Import message service
      const messageService = (await import('~/services/messageService')).default
      
      // Mark message as read
      const message = await messageService.markAsRead(messageId, socket.user._id)
      
      // Emit to sender that message was read
      this.io.to(`user:${message.fromId}`).emit('message_read', {
        messageId: message._id,
        readBy: socket.user._id,
        readAt: message.readAt
      })
    } catch (error) {
      console.error('❌ Mark message read error:', error)
      socket.emit('chat_error', { message: 'Failed to mark message as read' })
    }
  }

  /**
   * Send chat message to specific user
   */
  sendChatMessage(userId, messageData) {
    this.io.to(`user:${userId}`).emit('new_chat_message', messageData)
  }

  /**
   * Send chat message to conversation room
   */
  sendChatMessageToRoom(conversationId, messageData) {
    this.io.to(`chat:${conversationId}`).emit('new_chat_message', messageData)
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId, userId, userName, isTyping) {
    this.io.to(`chat:${conversationId}`).emit('typing_indicator', {
      userId,
      userName,
      isTyping,
      timestamp: new Date()
    })
  }

  /**
   * Send message read status
   */
  sendMessageReadStatus(senderId, messageId, readBy, readAt) {
    this.io.to(`user:${senderId}`).emit('message_read', {
      messageId,
      readBy,
      readAt
    })
  }

  /**
   * Handle join conversation
   */
  async handleJoinConversation(socket, data) {
    const { conversationId } = data
    
    if (!conversationId) {
      socket.emit('conversation_error', { message: 'Conversation ID is required' })
      return
    }

    // FIX: Chỉ join 1 room để tránh duplicate messages
    // Đơn giản hóa: chỉ dùng conversationId làm room name
    socket.join(conversationId)
    
    // Emit user joined event
    socket.to(conversationId).emit('user_joined_conversation', {
      userId: socket.user._id,
      userName: socket.user.name,
      conversationId,
      timestamp: new Date()
    })
  }

  /**
   * Handle leave conversation
   */
  handleLeaveConversation(socket, data) {
    const { conversationId } = data
    
    socket.leave(conversationId)
    
    // Emit user left event
    socket.to(conversationId).emit('user_left_conversation', {
      userId: socket.user._id,
      userName: socket.user.name,
      conversationId,
      timestamp: new Date()
    })
  }

  /**
   * Handle send message to conversation
   */
  async handleSendMessageToConversation(socket, data) {
    try {
      const { conversationId, content, messageType = 'text', toId, imageUrl } = data

      if (!conversationId || !content) {
        socket.emit('conversation_error', { message: 'Conversation ID and content are required' })
        return
      }

      // Import Message model và User model
      const Message = (await import('~/models/messageModel')).default
      const { getReceiverId } = await import('~/utils/chatHelper')
      
      const userRole = socket.user.roleId?.name || 'user'

      // Xác định toId dựa trên conversationId và fromId
      // ConversationId format: "userId1_userId2" (sorted)
      // toId sẽ là user ID khác fromId trong conversationId
      let targetToId = toId
      
      if (!targetToId) {
        // Sử dụng helper để xác định receiver
        targetToId = await getReceiverId(conversationId, socket.user._id.toString())
        
        if (!targetToId) {
          console.error(`❌ Could not determine toId for conversation: ${conversationId}, fromId: ${socket.user._id}`)
          socket.emit('conversation_error', { message: 'Could not determine receiver' })
          return
        }
      }
      
      // Tạo tin nhắn mới
      const message = await Message.create({
        conversationId,
        fromId: socket.user._id,
        toId: targetToId,
        content,
        messageType,
        imageUrl: imageUrl || null
      })

      await message.populate('fromId', 'name email avatar')
      if (targetToId) {
        await message.populate('toId', 'name email avatar')
      }

      // FIX: Đơn giản hóa - loại bỏ phân biệt role, chỉ dùng userId
      // Format message cho frontend - chỉ cần userId và conversationId
      const formattedMessage = {
        messageId: message._id,
        text: message.content,
        timestamp: message.createdAt,
        isRead: message.isRead,
        messageType: message.messageType || 'text',
        imageUrl: message.imageUrl || null,
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

      // FIX: Chỉ emit đến 1 room để tránh duplicate messages
      // Đơn giản hóa: chỉ dùng conversationId làm room name
      // FIX: Emit đến tất cả users trong conversation (bao gồm cả người gửi để sync)
      this.io.to(conversationId).emit('new_message', {
        message: formattedMessage,
        conversationId
      })
    } catch (error) {
      console.error('❌ Send message to conversation error:', error)
      socket.emit('conversation_error', { message: 'Failed to send message' })
    }
  }

  /**
   * Handle typing start
   */
  handleTypingStart(socket, data) {
    const conversationId = typeof data === 'object' ? data?.conversationId : data
    
    if (!conversationId) return

    // FIX: Chỉ emit đến 1 room
    socket.to(conversationId).emit('user_typing_conversation', {
      userId: socket.user._id,
      userName: socket.user.name,
      conversationId,
      isTyping: true,
      timestamp: new Date()
    })
  }

  /**
   * Handle typing stop
   */
  handleTypingStop(socket, data) {
    const conversationId = typeof data === 'object' ? data?.conversationId : data
    
    if (!conversationId) return

    // FIX: Chỉ emit đến 1 room
    socket.to(conversationId).emit('user_typing_conversation', {
      userId: socket.user._id,
      userName: socket.user.name,
      conversationId,
      isTyping: false,
      timestamp: new Date()
    })
  }

  /**
   * Get chat room members
   */
  getChatRoomMembers(conversationId) {
    const room = this.io.sockets.adapter.rooms.get(`chat:${conversationId}`)
    return room ? Array.from(room) : []
  }

  /**
   * Check if user is in chat room
   */
  isUserInChatRoom(conversationId, userId) {
    const userConnection = this.connectedUsers.get(userId.toString())
    if (!userConnection) return false
    
    const socket = this.io.sockets.sockets.get(userConnection.socketId)
    return socket ? socket.rooms.has(`chat:${conversationId}`) : false
  }
}

export default SocketHandler