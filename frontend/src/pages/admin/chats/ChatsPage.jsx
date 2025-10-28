import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../../contexts/AuthContext';
import { chatAPI } from '../../../services/apiService';

const ChatsPage = () => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!token) return

    const newSocket = io('http://localhost:5000', {
      auth: {
        token: token
      }
    })

    newSocket.on('connect', () => {
      console.log('🔌 Admin connected to chat server')
      setSocket(newSocket)
    })

    newSocket.on('disconnect', () => {
      console.log('🔌 Admin disconnected from chat server')
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error)
    })

    return () => {
      newSocket.close()
    }
  }, [token])

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true)
        const response = await chatAPI.getAdminConversations()
        const conversations = response.data.data.conversations || []
        setConversations(conversations)
        
        // Join tất cả conversations để nhận tin nhắn real-time
        if (socket && conversations.length > 0) {
          conversations.forEach(conversation => {
            socket.emit('join_conversation', { conversationId: conversation.conversationId })
          })
        }
      } catch (error) {
        console.error('Error loading conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    if (socket && user) {
      loadConversations()
    }
  }, [socket, user])

  // Load messages when conversation is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) return

      try {
        const response = await chatAPI.getConversationMessages(selectedConversation.conversationId, 1, 1000)
        setMessages(response.data.data.messages || [])
        
        // Join conversation room
        if (socket) {
          socket.emit('join_conversation', { conversationId: selectedConversation.conversationId })
        }
        
        // Join tất cả conversations để nhận tin nhắn real-time từ bất kỳ conversation nào
        if (socket && conversations.length > 0) {
          conversations.forEach(conversation => {
            socket.emit('join_conversation', { conversationId: conversation.conversationId })
          })
        }
      } catch (error) {
        console.error('Error loading messages:', error)
      }
    }

    loadMessages()
  }, [selectedConversation, socket])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (data) => {
      console.log('📨 Admin received new message:', data)
      console.log('📨 Current selected conversation:', selectedConversation)
      
      // Kiểm tra xem tin nhắn này có thuộc conversation hiện tại không
      if (data.conversationId !== selectedConversation?._id) {
        console.log('❌ Message not for current conversation:', data.conversationId, 'vs', selectedConversation?._id)
        return
      }
      
      // Kiểm tra xem tin nhắn này có phải là tin nhắn temp không
      const isTempMessage = data.message.messageId?.startsWith('temp_')
      if (isTempMessage) {
        return
      }
      
      // Kiểm tra xem có tin nhắn temp nào cần thay thế không
      setMessages(prev => {
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

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket || !selectedConversation) return

    try {
      // Thêm tin nhắn vào state ngay lập tức (Optimistic UI)
      const tempMessage = {
        messageId: `temp_${Date.now()}`,
        sender: 'admin',
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
        toUser: selectedConversation.user ? {
          userId: selectedConversation.user.userId,
          name: selectedConversation.user.name,
          email: selectedConversation.user.email,
          avatar: selectedConversation.user.avatar
        } : null
      }
      
      setMessages(prev => [...prev, tempMessage])
      scrollToBottom()

      // Send via socket for real-time
      socket.emit('send_message', {
        conversationId: selectedConversation.conversationId,
        content: newMessage.trim(),
        messageType: 'text'
      })

      setNewMessage('')
      
      // Stop typing indicator
      if (socket) {
        socket.emit('typing_stop', { conversationId: selectedConversation._id })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Có lỗi xảy ra khi gửi tin nhắn!')
    }
  }

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Chỉ được gửi file ảnh')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    try {
      setUploadingImage(true)
      
      // Upload image
      const formData = new FormData()
      formData.append('image', file)
      
      const uploadResponse = await chatAPI.uploadImage(formData)
      const imageUrl = uploadResponse.data.data.imageUrl

      // Thêm tin nhắn ảnh vào state ngay lập tức (Optimistic UI)
      const tempImageMessage = {
        messageId: `temp_${Date.now()}`,
        sender: 'admin',
        text: 'Đã gửi ảnh',
        timestamp: new Date(),
        isRead: false,
        messageType: 'image',
        imageUrl: imageUrl,
        fromUser: {
          userId: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        toUser: selectedConversation.user ? {
          userId: selectedConversation.user.userId,
          name: selectedConversation.user.name,
          email: selectedConversation.user.email,
          avatar: selectedConversation.user.avatar
        } : null
      }
      
      setMessages(prev => [...prev, tempImageMessage])
      scrollToBottom()

      // Send image message via socket
      socket.emit('send_message', {
        conversationId: selectedConversation.conversationId,
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
      alert('Không thể tải ảnh lên')
    } finally {
      setUploadingImage(false)
    }
  }

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value)
    
    if (!socket || !selectedConversation) return

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Start typing indicator
    if (!isTyping) {
      setIsTyping(true)
      socket.emit('typing_start', { conversationId: selectedConversation.conversationId })
    }

    // Stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket.emit('typing_stop', { conversationId: selectedConversation.conversationId })
    }, 2000)
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200"> 
        <div className="flex h-[87vh]">
          {/* Chat List */}
          <div className="w-1/3 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Cuộc trò chuyện</h3>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    {conversations.length} cuộc trò chuyện
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${socket?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-500">
                      {socket?.connected ? 'Đã kết nối' : 'Mất kết nối'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Chưa có cuộc trò chuyện nào
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.conversationId}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedConversation?.conversationId === conversation.conversationId ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {conversation.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.user?.name || 'User'}
                        </p>
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.messages?.[0]?.text || 'Chưa có tin nhắn'}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {conversation.lastMessageTime ? formatTime(conversation.lastMessageTime) : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {selectedConversation.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {selectedConversation.user?.name || 'User'}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {selectedConversation.user?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-4xl mb-4">💬</div>
                      <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        return (
                          <div
                            key={message.messageId}
                            className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender === 'admin'
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
                                      console.error('❌ Admin image load error:', e)
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
                            ) : message.text.includes('📦 **Thông tin đơn hàng cần hỗ trợ:**') ? (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="text-sm whitespace-pre-line">{message.text}</div>
                              </div>
                            ) : (
                              <p className="text-sm">{message.text}</p>
                            )}
                              <p className={`text-xs mt-1 ${
                                message.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatsPage;
