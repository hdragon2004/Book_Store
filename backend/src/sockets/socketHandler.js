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
        const decoded = jwt.verify(token, config.jwtSecret)
        
        // Lấy thông tin user
        const user = await User.findById(decoded.id).select('-password')
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
      console.log(`🔌 User connected: ${socket.user.name} (${socket.id})`)
      
      // Lưu user connection
      this.connectedUsers.set(socket.user._id.toString(), {
        socketId: socket.id,
        user: socket.user,
        connectedAt: new Date()
      })

      // Join user vào room riêng của họ
      socket.join(`user:${socket.user._id}`)

      // Join admin vào admin room nếu là admin
      if (socket.user.roleId === 'admin') {
        socket.join('admin')
      }

      // Event: User join room
      socket.on('join_room', (room) => {
        socket.join(room)
        console.log(`👤 User ${socket.user.name} joined room: ${room}`)
      })

      // Event: User leave room
      socket.on('leave_room', (room) => {
        socket.leave(room)
        console.log(`👤 User ${socket.user.name} left room: ${room}`)
      })

      // Event: Send message
      socket.on('send_message', (data) => {
        this.handleSendMessage(socket, data)
      })

      // Event: Chat message
      socket.on('chat_message', (data) => {
        this.handleChatMessage(socket, data)
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

    console.log(`💬 Message sent to room ${room} by ${socket.user.name}`)
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

    console.log(`📦 Order status updated: ${orderId} - ${status}`)
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

    console.log(`📚 Stock updated: ${bookTitle} - ${oldStock} → ${newStock}`)
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

    console.log(`⭐ New review for book ${bookTitle} by ${socket.user.name}`)
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
    console.log(`🔌 User disconnected: ${socket.user.name} (${socket.id})`)
    
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

    console.log(`🔔 Notification sent to user ${userId}: ${title}`)
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

      console.log(`💬 Chat message sent from ${socket.user.name} to user ${toId}`)
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
    
    console.log(`💬 User ${socket.user.name} joined chat with user ${userId}`)
    
    // Emit confirmation
    socket.emit('chat_joined', { userId })
  }

  /**
   * Handle leave chat
   */
  handleLeaveChat(socket, data) {
    const { userId } = data
    
    console.log(`💬 User ${socket.user.name} left chat with user ${userId}`)
    
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
      
      console.log(`💬 Message ${messageId} marked as read by ${socket.user.name}`)
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