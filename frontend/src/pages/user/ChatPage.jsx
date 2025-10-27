import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../../contexts/AuthContext'
import { chatAPI } from '../../services/apiService'
import OrderInfoCard from '../../components/OrderInfoCard'

const ChatPage = () => {
  console.log('🔍 ChatPage component rendering...')
  const { user, token } = useAuth()
  const [socket, setSocket] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [orderMessageSent, setOrderMessageSent] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [orderInfo, setOrderInfo] = useState(null)
  const [messages, setMessages] = useState([])
  const [adminUser, setAdminUser] = useState(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)

  // Initialize socket connection
  useEffect(() => {
    if (!token) {
      console.log('❌ No token available for socket connection')
      return
    }

    console.log('🔌 Initializing socket connection...')
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: token
      }
    })

    newSocket.on('connect', () => {
      console.log('🔌 Connected to chat server')
      setSocket(newSocket)
    })

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from chat server')
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error)
      console.error('❌ Error details:', error.message)
      setError('Không thể kết nối đến server chat: ' + error.message)
    })

    return () => {
      newSocket.close()
    }
  }, [token])

  // Get or create conversation
  useEffect(() => {
    const getConversation = async () => {
      try {
        console.log('🔍 Getting conversation for user:', user)
        setLoading(true)
        const response = await chatAPI.getOrCreateConversation()
        console.log('📨 Conversation response:', response)
        const { conversationId, adminUser } = response.data.data
        setConversationId(conversationId)
        setAdminUser(adminUser)
        
        // Load messages
        await loadMessages(conversationId)
        
        // Kiểm tra xem có thông tin đơn hàng từ OrderDetailPage không
        const storedOrderInfo = localStorage.getItem('supportOrderInfo')
        console.log('🔍 Checking localStorage for supportOrderInfo:', storedOrderInfo)
        if (storedOrderInfo) {
          try {
            const orderData = JSON.parse(storedOrderInfo)
            console.log('📦 Order info found:', orderData)
            console.log('📦 Setting orderInfo state...')
            setOrderInfo(orderData)
            console.log('📦 orderInfo state set successfully')
            
            // Xóa thông tin đơn hàng khỏi localStorage ngay lập tức
            localStorage.removeItem('supportOrderInfo')
            console.log('📦 Removed supportOrderInfo from localStorage')
          } catch (error) {
            console.error('❌ Error processing order info:', error)
          }
        } else {
          console.log('📦 No supportOrderInfo found in localStorage')
        }
      } catch (error) {
        console.error('❌ Error getting conversation:', error)
        setError('Không thể tải cuộc trò chuyện')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      getConversation()
    }
  }, [user])

  // Join conversation when socket is ready
  useEffect(() => {
    if (socket && conversationId) {
      socket.emit('join_conversation', { conversationId })
    }
  }, [socket, conversationId])

  // Reset flag khi orderInfo thay đổi để có thể gửi tin nhắn cho đơn hàng mới
  useEffect(() => {
    setOrderMessageSent(false)
  }, [orderInfo])

  // Gửi tin nhắn đơn hàng khi có orderInfo và socket sẵn sàng
  useEffect(() => {
    const sendOrderMessage = async () => {
      // Chỉ gửi nếu chưa gửi và có đủ điều kiện
      if (orderInfo && socket && socket.connected && conversationId && !orderMessageSent) {
        try {
          const orderMessage = `📦 Tôi cần hỗ trợ về đơn hàng ${orderInfo.orderCode}. Vui lòng xem chi tiết bên dưới.`

          // Gửi tin nhắn tự động qua socket
          socket.emit('send_message', {
            conversationId,
            content: orderMessage,
            messageType: 'text'
          })

          // Đánh dấu đã gửi để tránh spam
          setOrderMessageSent(true)
        } catch (error) {
          console.error('❌ Error sending order message:', error)
        }
      }
    }

    sendOrderMessage()
  }, [orderInfo, socket, conversationId, orderMessageSent])

  // Load messages
  const loadMessages = async (convId) => {
    try {
      const response = await chatAPI.getUserConversationMessages(convId, 1, 1000)
      setMessages(response.data.data.messages || [])
    } catch (error) {
      console.error('❌ Error loading messages:', error)
    }
  }

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (data) => {
      // Kiểm tra xem tin nhắn này có phải là tin nhắn temp không
      const isTempMessage = data.message.messageId?.startsWith('temp_')
      if (isTempMessage) {
        return
      }
      
      // Kiểm tra xem tin nhắn này đã tồn tại chưa (tránh duplicate)
      setMessages(prev => {
        // Kiểm tra xem có tin nhắn temp nào cần thay thế không
        const tempMessageIndex = prev.findIndex(msg => 
          msg.messageId?.startsWith('temp_') && 
          msg.text === data.message.text &&
          msg.sender === data.message.sender
        )
        
        if (tempMessageIndex !== -1) {
          const newMessages = [...prev]
          newMessages[tempMessageIndex] = data.message
          return newMessages
        }
        
        // Kiểm tra xem tin nhắn này đã tồn tại chưa
        const exists = prev.some(msg => msg.messageId === data.message.messageId)
        if (exists) {
          return prev
        }
        
        return [...prev, data.message]
      })
      
      scrollToBottom()
    }

    const handleUserTyping = (data) => {
      if (data.userId !== user._id) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId)
          if (data.isTyping) {
            return [...filtered, { userId: data.userId, userName: data.userName }]
          }
          return filtered
        })
      }
    }

    const handleUserJoined = (data) => {
      console.log(`👥 ${data.userName} joined the conversation`)
    }

    const handleUserLeft = (data) => {
      console.log(`👋 ${data.userName} left the conversation`)
    }

    socket.on('new_message', handleNewMessage)
    socket.on('user_typing_conversation', handleUserTyping)
    socket.on('user_joined_conversation', handleUserJoined)
    socket.on('user_left_conversation', handleUserLeft)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('user_typing_conversation', handleUserTyping)
      socket.off('user_joined_conversation', handleUserJoined)
      socket.off('user_left_conversation', handleUserLeft)
    }
  }, [socket, user])

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket || !conversationId) return

    try {
      console.log('📤 User sending message:', {
        conversationId,
        content: newMessage.trim(),
        messageType: 'text',
        socketConnected: socket?.connected
      })

      // Thêm tin nhắn vào state ngay lập tức để hiển thị
      const tempMessage = {
        messageId: `temp_${Date.now()}`,
        sender: 'user',
        text: newMessage.trim(),
        timestamp: new Date(),
        isRead: false,
        messageType: 'text',
        imageUrl: null,
        fromUser: {
          userId: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        toUser: adminUser ? {
          userId: adminUser.userId,
          name: adminUser.name,
          email: adminUser.email,
          avatar: adminUser.avatar
        } : null
      }
      
      setMessages(prev => [...prev, tempMessage])
      scrollToBottom()

      // Send via socket for real-time
      socket.emit('send_message', {
        conversationId,
        content: newMessage.trim(),
        messageType: 'text'
      })

      setNewMessage('')
      
      // Stop typing indicator
      if (socket) {
        socket.emit('typing_stop', { conversationId })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Không thể gửi tin nhắn')
    }
  }

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Chỉ được gửi file ảnh')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    try {
      setUploadingImage(true)
      
      // Upload image
      const formData = new FormData()
      formData.append('image', file)
      
      const uploadResponse = await chatAPI.uploadImage(formData)
      const imageUrl = uploadResponse.data.data.imageUrl

      // Send image message via socket
      socket.emit('send_message', {
        conversationId,
        content: 'Đã gửi ảnh',
        messageType: 'image',
        imageUrl: imageUrl
      })

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Không thể tải ảnh lên')
    } finally {
      setUploadingImage(false)
    }
  }

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value)
    
    if (!socket || !conversationId) return

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Start typing indicator
    if (!isTyping) {
      setIsTyping(true)
      socket.emit('typing_start', { conversationId })
    }

    // Stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket.emit('typing_stop', { conversationId })
    }, 2000)
  }

  // Format time
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('vi-VN')
  }

  if (loading) {
    console.log('🔍 ChatPage loading...')
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Đang tải...</p>
      </div>
    )
  }

  if (error) {
    console.log('🔍 ChatPage error:', error)
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg mb-4">❌ {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Thử lại
        </button>
      </div>
    )
  }

  console.log('🔍 ChatPage rendering main content...')
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hỗ trợ khách hàng</h1>
              <p className="text-gray-600 mt-1">Chúng tôi sẽ phản hồi trong thời gian sớm nhất</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${socket?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-500">
                {socket?.connected ? 'Đã kết nối' : 'Mất kết nối'}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">💬</div>
              <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Debug logs */}
              {console.log('🔍 Debug - orderInfo:', orderInfo)}
              {console.log('🔍 Debug - socket connected:', socket?.connected)}
              {console.log('🔍 Debug - conversationId:', conversationId)}
              
              {/* Hiển thị thông tin đơn hàng nếu có */}
              {orderInfo && (
                <div className="flex justify-start">
                  <OrderInfoCard orderInfo={orderInfo} />
                </div>
              )}
                      {messages.map((message) => {
                        const isFromUser = message.sender === 'user'
                        return (
                          <div
                            key={message.messageId || message._id || `msg_${Date.now()}`}
                            className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isFromUser
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              {message.messageType === 'image' ? (
                                <div>
                                  {message.imageUrl ? (
                                    <img 
                                      src={`http://localhost:5000${message.imageUrl}`} 
                                      alt="Uploaded image" 
                                      className="max-w-full h-auto rounded mb-2"
                                      style={{ maxHeight: '200px' }}
                                      onError={(e) => {
                                        console.error('❌ Image load error:', e)
                                      }}
                                      onLoad={() => {
                                        // Image loaded successfully
                                      }}
                                    />
                                  ) : (
                                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
                                      <div className="text-gray-500 text-sm">📷 Ảnh không khả dụng</div>
                                    </div>
                                  )}
                                  <p className="text-sm">{message.text}</p>
                                </div>
                              ) : message.text && message.text.includes('📦 **Thông tin đơn hàng cần hỗ trợ:**') ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="text-sm whitespace-pre-line">{message.text}</div>
                                </div>
                              ) : (
                                <p className="text-sm">{message.text}</p>
                              )}
                              <p className={`text-xs mt-1 ${
                                isFromUser ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <p className="text-sm text-gray-500">
                      {typingUsers.map(u => u.userName).join(', ')} đang nhập...
                    </p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!socket?.connected || uploadingImage}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={!socket?.connected || uploadingImage}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!socket?.connected || uploadingImage}
              className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Gửi ảnh"
            >
              {uploadingImage ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                '📷'
              )}
            </button>
            <button
              type="submit"
              disabled={!newMessage.trim() || !socket?.connected || uploadingImage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Gửi
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChatPage
