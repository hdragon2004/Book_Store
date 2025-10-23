/**
 * 💬 Chat System Usage Examples
 * 
 * File này chứa các ví dụ về cách sử dụng hệ thống chat
 * trong Book Store application
 */

import io from 'socket.io-client'
import axios from 'axios'

// ========================================
// 1. KẾT NỐI SOCKET.IO
// ========================================

const connectToChat = (token) => {
  const socket = io('http://localhost:5000', {
    auth: {
      token: token
    }
  })

  // Lắng nghe kết nối thành công
  socket.on('connect', () => {
    console.log('✅ Connected to chat server')
  })

  // Lắng nghe lỗi kết nối
  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message)
  })

  return socket
}

// ========================================
// 2. GỬI TIN NHẮN
// ========================================

const sendMessage = (socket, receiverId, content) => {
  socket.emit('chat_message', {
    receiverId: receiverId,
    content: content,
    messageType: 'text'
  })
}

// Gửi tin nhắn với file đính kèm
const sendMessageWithAttachment = (socket, receiverId, content, attachments) => {
  socket.emit('chat_message', {
    receiverId: receiverId,
    content: content,
    messageType: 'file',
    attachments: attachments
  })
}

// ========================================
// 3. LẮNG NGHE TIN NHẮN
// ========================================

const setupMessageListeners = (socket) => {
  // Tin nhắn mới
  socket.on('new_chat_message', (message) => {
    console.log('📨 Tin nhắn mới:', message)
    displayMessage(message)
  })

  // Tin nhắn đã được gửi thành công
  socket.on('chat_message_sent', (data) => {
    console.log('✅ Tin nhắn đã gửi:', data)
    updateMessageStatus(data.id, 'sent')
  })

  // Tin nhắn đã được đọc
  socket.on('message_read', (data) => {
    console.log('👁️ Tin nhắn đã đọc:', data)
    updateMessageStatus(data.messageId, 'read')
  })

  // Lỗi chat
  socket.on('chat_error', (error) => {
    console.error('❌ Lỗi chat:', error.message)
    showError(error.message)
  })
}

// ========================================
// 4. QUẢN LÝ CONVERSATION
// ========================================

const joinConversation = (socket, conversationId) => {
  socket.emit('join_chat', {
    conversationId: conversationId,
    userId: getCurrentUserId()
  })
}

const leaveConversation = (socket, conversationId) => {
  socket.emit('leave_chat', {
    conversationId: conversationId
  })
}

// ========================================
// 5. API CALLS
// ========================================

// Lấy danh sách conversation
const getConversations = async (token, page = 1, limit = 20) => {
  try {
    const response = await axios.get(`/api/messages/conversations?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  } catch (error) {
    console.error('❌ Lỗi lấy conversation:', error)
    throw error
  }
}

// Lấy tin nhắn theo conversation
const getMessagesByConversation = async (token, conversationId, page = 1, limit = 50) => {
  try {
    const response = await axios.get(`/api/messages/conversation/${conversationId}?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  } catch (error) {
    console.error('❌ Lỗi lấy tin nhắn:', error)
    throw error
  }
}

// Tìm kiếm tin nhắn
const searchMessages = async (token, query, filters = {}) => {
  try {
    const params = new URLSearchParams({
      q: query,
      ...filters
    })
    
    const response = await axios.get(`/api/messages/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  } catch (error) {
    console.error('❌ Lỗi tìm kiếm:', error)
    throw error
  }
}

// Đánh dấu tin nhắn đã đọc
const markMessageAsRead = async (token, messageId) => {
  try {
    const response = await axios.put(`/api/messages/${messageId}/read`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  } catch (error) {
    console.error('❌ Lỗi đánh dấu đã đọc:', error)
    throw error
  }
}

// Ghim tin nhắn
const pinMessage = async (token, messageId, isPinned) => {
  try {
    const response = await axios.put(`/api/messages/${messageId}/pin`, {
      isPinned: isPinned
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  } catch (error) {
    console.error('❌ Lỗi ghim tin nhắn:', error)
    throw error
  }
}

// Upload file đính kèm
const uploadAttachment = async (token, file) => {
  try {
    const formData = new FormData()
    formData.append('attachment', file)
    
    const response = await axios.post('/api/messages/upload', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  } catch (error) {
    console.error('❌ Lỗi upload file:', error)
    throw error
  }
}

// ========================================
// 6. REACT COMPONENT EXAMPLE
// ========================================

const ChatComponent = () => {
  const [socket, setSocket] = useState(null)
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [currentConversation, setCurrentConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')

  // Khởi tạo socket khi component mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      const newSocket = connectToChat(token)
      setSocket(newSocket)
      setupMessageListeners(newSocket)
      
      // Lấy danh sách conversation
      getConversations(token).then(data => {
        setConversations(data.data.conversations)
      })
    }

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  // Gửi tin nhắn
  const handleSendMessage = () => {
    if (newMessage.trim() && socket && currentConversation) {
      sendMessage(socket, currentConversation.otherUserId, newMessage.trim())
      setNewMessage('')
    }
  }

  // Chọn conversation
  const selectConversation = (conversation) => {
    setCurrentConversation(conversation)
    
    // Join conversation room
    if (socket) {
      joinConversation(socket, conversation.conversationId)
    }
    
    // Lấy tin nhắn của conversation
    getMessagesByConversation(localStorage.getItem('token'), conversation.conversationId)
      .then(data => {
        setMessages(data.data.messages)
      })
  }

  // Hiển thị tin nhắn
  const displayMessage = (message) => {
    setMessages(prev => [...prev, message])
  }

  // Cập nhật trạng thái tin nhắn
  const updateMessageStatus = (messageId, status) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      )
    )
  }

  return (
    <div className="chat-container">
      {/* Danh sách conversation */}
      <div className="conversation-list">
        {conversations.map(conv => (
          <div 
            key={conv.conversationId}
            className={`conversation-item ${currentConversation?.conversationId === conv.conversationId ? 'active' : ''}`}
            onClick={() => selectConversation(conv)}
          >
            <div className="conversation-info">
              <h4>{conv.otherUser.name}</h4>
              <p>{conv.lastMessage.content}</p>
            </div>
            <div className="conversation-meta">
              <span className="time">
                {new Date(conv.lastMessage.createdAt).toLocaleTimeString()}
              </span>
              {conv.unreadCount > 0 && (
                <span className="unread-badge">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div className="chat-area">
        {currentConversation ? (
          <>
            {/* Tin nhắn */}
            <div className="messages-container">
              {messages.map(message => (
                <div 
                  key={message.id}
                  className={`message ${message.senderId === getCurrentUserId() ? 'own' : 'other'}`}
                >
                  <div className="message-content">
                    {message.content}
                  </div>
                  <div className="message-meta">
                    <span className="time">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                    {message.status === 'read' && (
                      <span className="read-status">✓✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input gửi tin nhắn */}
            <div className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhập tin nhắn..."
              />
              <button onClick={handleSendMessage}>
                Gửi
              </button>
            </div>
          </>
        ) : (
          <div className="no-conversation">
            <p>Chọn một cuộc trò chuyện để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ========================================
// 7. UTILITY FUNCTIONS
// ========================================

// Lấy user ID hiện tại
const getCurrentUserId = () => {
  // Implement logic to get current user ID
  return localStorage.getItem('userId')
}

// Hiển thị lỗi
const showError = (message) => {
  // Implement error display logic
  console.error('Error:', message)
}

// Format thời gian
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ========================================
// 8. CUSTOMER SERVICE WORKFLOW
// ========================================

const customerServiceWorkflow = {
  // Nhận tin nhắn từ khách hàng
  handleCustomerMessage: (message) => {
    console.log('📞 Tin nhắn từ khách hàng:', message)
    
    // Phân loại tin nhắn
    if (message.content.includes('hỗ trợ') || message.content.includes('giúp')) {
      // Tin nhắn yêu cầu hỗ trợ
      return 'support_request'
    } else if (message.content.includes('đơn hàng') || message.content.includes('order')) {
      // Tin nhắn về đơn hàng
      return 'order_inquiry'
    } else {
      // Tin nhắn thường
      return 'general'
    }
  },

  // Phản hồi tự động
  sendAutoResponse: (socket, receiverId, messageType) => {
    const responses = {
      support_request: 'Xin chào! Tôi sẽ hỗ trợ bạn ngay. Vui lòng cho tôi biết vấn đề cụ thể.',
      order_inquiry: 'Cảm ơn bạn đã liên hệ! Tôi sẽ kiểm tra thông tin đơn hàng của bạn.',
      general: 'Xin chào! Tôi có thể giúp gì cho bạn?'
    }

    const response = responses[messageType] || responses.general
    
    sendMessage(socket, receiverId, response)
  },

  // Đánh dấu tin nhắn quan trọng
  markImportant: async (token, messageId) => {
    try {
      await axios.put(`/api/messages/${messageId}/important`, {
        isImportant: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error('❌ Lỗi đánh dấu quan trọng:', error)
    }
  }
}

// ========================================
// 9. ADMIN DASHBOARD
// ========================================

const adminDashboard = {
  // Lấy thống kê chat
  getChatStatistics: async (token, dateRange) => {
    try {
      const response = await axios.get(`/api/messages/statistics?${new URLSearchParams(dateRange)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.data
    } catch (error) {
      console.error('❌ Lỗi lấy thống kê:', error)
      throw error
    }
  },

  // Lấy tất cả conversation
  getAllConversations: async (token) => {
    try {
      const response = await axios.get('/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.data
    } catch (error) {
      console.error('❌ Lỗi lấy conversation:', error)
      throw error
    }
  },

  // Lắng nghe tin nhắn real-time
  setupAdminListeners: (socket) => {
    socket.on('new_chat_message', (message) => {
      if (message.isFromCustomerService) {
        console.log('📞 Tin nhắn từ customer service:', message)
      } else {
        console.log('👤 Tin nhắn từ khách hàng:', message)
      }
    })
  }
}

export {
  connectToChat,
  sendMessage,
  sendMessageWithAttachment,
  setupMessageListeners,
  joinConversation,
  leaveConversation,
  getConversations,
  getMessagesByConversation,
  searchMessages,
  markMessageAsRead,
  pinMessage,
  uploadAttachment,
  ChatComponent,
  customerServiceWorkflow,
  adminDashboard
}
