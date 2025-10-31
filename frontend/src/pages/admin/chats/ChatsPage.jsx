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
  const selectedConversationRef = useRef(null); // Lưu selectedConversation hiện tại
  const conversationsLoadedRef = useRef(false); // Track xem đã load conversations chưa
  const currentConversationIdRef = useRef(null); // Track conversationId hiện tại đang load
  const isUserScrollingRef = useRef(false); // Track user scroll state
  const lastMessagesLengthRef = useRef(0); // Track số lượng messages để detect tin nhắn mới
  // FIX: Sử dụng Set để track messageId (O(1) lookup) - tránh duplicate messages
  const messageIdsSetRef = useRef(new Set()); // Track messageId đã thêm vào state
  // FIX: Sử dụng Set để track messageId đang được xử lý (lock mechanism - tránh race condition)
  const processingMessagesRef = useRef(new Set()); // Track messageId đang được xử lý

  // Initialize socket connection
  useEffect(() => {
    if (!token) return

    const newSocket = io('http://localhost:5000', {
      auth: {
        token: token
      }
    })

    newSocket.on('connect', () => {
      setSocket(newSocket)
    })

    newSocket.on('disconnect', () => {
      // Handle disconnect
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error)
    })

    return () => {
      newSocket.close()
    }
  }, [token])

  // Load conversations - FIX: Chỉ set loading lần đầu, tránh reload không cần thiết
  useEffect(() => {
    const loadConversations = async () => {
      // Chỉ set loading khi chưa load lần nào
      if (!conversationsLoadedRef.current) {
        setLoading(true)
      }
      
      try {
        const response = await chatAPI.getAdminConversations()
        const conversations = response.data.data.conversations || []
        setConversations(conversations)
        conversationsLoadedRef.current = true
        
        // FIX: Không join tất cả conversations khi load list
        // Chỉ join khi select conversation để tránh duplicate
      } catch (error) {
        console.error('Error loading conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    if (socket && user) {
      loadConversations()
    }
  }, [socket, user?._id]) // FIX: Chỉ dùng user._id thay vì toàn bộ user object

  // Load messages when conversation is selected - FIX: Tránh reload khi user object thay đổi reference
  useEffect(() => {
      const loadMessages = async () => {
        if (!selectedConversation) {
          setMessages([])
          currentConversationIdRef.current = null
          // FIX: Reset messageIdsSet khi không có conversation được chọn
          messageIdsSetRef.current.clear()
          return
        }

      const convId = selectedConversation.conversationId || selectedConversation._id
      
      // Tránh reload nếu đang load cùng conversation
      if (currentConversationIdRef.current === convId) {
        return
      }
      
      currentConversationIdRef.current = convId

      try {
        const response = await chatAPI.getConversationMessages(convId, 1, 1000)
        const raw = response?.data?.data?.messages || response?.data?.messages || []

        // Chuẩn hóa dữ liệu message để UI hiển thị ổn định
        const normalized = raw.map((msg) => {
          const fromUser = msg.fromUser || (msg.fromId ? {
            userId: msg.fromId._id || msg.fromId,
            name: msg.fromId.name,
            email: msg.fromId.email,
            avatar: msg.fromId.avatar
          } : null)

          const toUser = msg.toUser || (msg.toId ? {
            userId: msg.toId._id || msg.toId,
            name: msg.toId.name,
            email: msg.toId.email,
            avatar: msg.toId.avatar
          } : null)

          // FIX: Đơn giản hóa - loại bỏ phân biệt role, chỉ dùng userId
          // FIX: Đảm bảo messageId luôn là string để so sánh chính xác
          const messageId = String(msg.messageId || msg._id || '')
          
          return {
            messageId,
            text: msg.text || msg.content || '',
            timestamp: msg.timestamp || msg.createdAt || new Date(),
            isRead: msg.isRead ?? false,
            messageType: msg.messageType || 'text',
            imageUrl: msg.imageUrl || null,
            fromUser,
            toUser
          }
        })
        // Sắp xếp tăng dần theo thời gian để tin cũ ở trên, tin mới ở dưới
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

        setMessages(normalized)
        
        // FIX: Reset và rebuild messageIdsSet khi load messages mới
        messageIdsSetRef.current.clear()
        normalized.forEach(msg => {
          const msgId = String(msg.messageId || '')
          if (msgId && !msgId.startsWith('temp_')) {
            messageIdsSetRef.current.add(msgId)
          }
        })
        
        // FIX: Join conversation room khi chọn conversation
        // Đảm bảo join đúng format conversationId
        if (socket && convId) {
          socket.emit('join_conversation', convId)
        }
      } catch (error) {
        console.error('Error loading messages:', error)
        currentConversationIdRef.current = null // Reset on error
      }
    }

    loadMessages()
  }, [selectedConversation?.conversationId || selectedConversation?._id, socket]) // FIX: Chỉ dùng conversationId thay vì toàn bộ object
  
  // Update ref với selected conversation hiện tại
  useEffect(() => {
    selectedConversationRef.current = selectedConversation
  }, [selectedConversation])

  // FIX #6: Socket event listeners - Đảm bảo chỉ đăng ký 1 lần
  // VẤN ĐỀ: Socket event listener có thể bị đăng ký nhiều lần nếu component re-render
  // GIẢI PHÁP: Cleanup trước khi đăng ký mới và đảm bảo dependencies đúng
  useEffect(() => {
    if (!socket) return

    // FIX: Đảm bảo cleanup trước khi đăng ký mới (tránh duplicate listeners)
    // Socket.io cho phép multiple listeners, nhưng ta muốn chỉ 1 listener
    socket.off('new_message')
    socket.off('user_typing_conversation')
    socket.off('user_joined_conversation')
    socket.off('user_left_conversation')

    const handleNewMessage = (data) => {
      // Kiểm tra xem có message trong data không
      if (!data.message) {
        console.error('❌ No message in data:', data)
        return
      }
      
      // FIX: Normalize messageId ngay từ đầu để check duplicate
      const messageId = String(data.message.messageId || '')
      
      // FIX: Kiểm tra duplicate NGAY LẦN ĐẦU (trước khi xử lý logic phức tạp)
      // Đây là defense layer đầu tiên để chặn duplicate do race condition
      if (messageId && !messageId.startsWith('temp_')) {
        // Kiểm tra xem messageId này đang được xử lý không (lock mechanism)
        if (processingMessagesRef.current.has(messageId)) {
          return // Bỏ qua message này hoàn toàn
        }
        
        // Đánh dấu messageId đang được xử lý
        processingMessagesRef.current.add(messageId)
        
        // Cleanup sau 1 giây (đảm bảo không bị stuck)
        setTimeout(() => {
          processingMessagesRef.current.delete(messageId)
        }, 1000)
      }
      
      // Lấy selectedConversation hiện tại từ ref (luôn là giá trị mới nhất)
      const current = selectedConversationRef.current
      const currentConversationId = current?.conversationId || current?._id
      
      // Kiểm tra xem tin nhắn này có thuộc conversation hiện tại không
      const isForCurrentConversation = data.conversationId === currentConversationId
      
      if (!isForCurrentConversation && current) {
        // Cập nhật conversation list nếu có tin nhắn mới từ conversation khác
        // TODO: Cập nhật conversation list để hiển thị unread count
        return
      }
      
      // Nếu không có conversation được chọn, không hiển thị message
      if (!current) {
        return
      }
      
      // FIX: Đơn giản hóa - loại bỏ phân biệt role, chỉ dùng userId
      const isFromCurrentUser = data.message?.fromUser?.userId?.toString() === user?._id?.toString()
      
      // Kiểm tra xem tin nhắn này có phải là tin nhắn temp không (từ socket - không nên xảy ra)
      const isTempMessage = data.message?.messageId?.startsWith('temp_')
      if (isTempMessage) {
        return
      }

      setMessages(prev => {
        // Normalize messageId để so sánh (convert về string)
        const newMessageId = String(data.message.messageId || '')
        
        // BƯỚC 1: Kiểm tra duplicate dựa trên messageId (CHÍNH XÁC NHẤT) - PHẢI LÀM TRƯỚC
        // FIX: Kiểm tra trong Set trước (O(1)) - nhanh nhất
        if (newMessageId && !newMessageId.startsWith('temp_')) {
          if (messageIdsSetRef.current.has(newMessageId)) {
            processingMessagesRef.current.delete(newMessageId)
            return prev
          }
        }
        
        // FIX: Kiểm tra duplicate trong state array (fallback)
        // QUAN TRỌNG: Normalize cả 2 messageId về string để so sánh chính xác
        const exists = prev.some(msg => {
          const msgId = String(msg.messageId || '')
          // Chỉ kiểm tra real messages (không phải temp)
          if (msgId.startsWith('temp_')) return false
          if (msgId === '' || newMessageId === '') return false
          
          // So sánh sau khi normalize cả 2 về string
          return msgId === newMessageId
        })
        
        if (exists) {
          // FIX: Thêm vào Set để tránh check lại lần sau
          if (newMessageId && !newMessageId.startsWith('temp_')) {
            messageIdsSetRef.current.add(newMessageId)
            processingMessagesRef.current.delete(newMessageId)
          }
          return prev
        }
        
        // BƯỚC 2: Thay thế temp message nếu có (cho user gửi message)
        // FIX: Đơn giản hóa - chỉ check text và fromUser userId
        const tempMessageIndex = prev.findIndex(msg => {
          // Chỉ xử lý temp messages
          if (!String(msg.messageId || '').startsWith('temp_')) return false
          
          // Match đơn giản: text và fromUser userId giống nhau
          const textMatch = String(msg.text || '') === String(data.message.text || '')
          const isFromSameUser = String(msg.fromUser?.userId || '') === String(data.message.fromUser?.userId || '')
          
          return textMatch && isFromSameUser
        })
        
        if (tempMessageIndex !== -1) {
          const newMessages = [...prev]
          newMessages[tempMessageIndex] = data.message
          
          // FIX: Thêm messageId vào Set sau khi thay thế
          if (newMessageId && !newMessageId.startsWith('temp_')) {
            messageIdsSetRef.current.add(newMessageId)
            processingMessagesRef.current.delete(newMessageId)
          }
          
          return newMessages
        }
        
        // BƯỚC 3: Kiểm tra duplicate dựa trên content và timestamp (fallback)
        // FIX: Đơn giản hóa - chỉ check text, fromUser userId, và timestamp
        const duplicateIndex = prev.findIndex(msg => {
          const msgId = String(msg.messageId || '')
          // Bỏ qua temp messages
          if (msgId.startsWith('temp_')) return false
          
          // Match chính xác: text, fromUser userId, và timestamp rất gần nhau (< 1 giây)
          const textMatch = String(msg.text || '') === String(data.message.text || '')
          const isFromSameUser = String(msg.fromUser?.userId || '') === String(data.message.fromUser?.userId || '')
          
          // Timestamp phải rất gần nhau (< 1 giây) để chắc chắn là duplicate
          const timeDiff = Math.abs(
            new Date(data.message.timestamp).getTime() - new Date(msg.timestamp).getTime()
          )
          const isVeryClose = timeDiff < 1000 // 1 giây
          
          return textMatch && isFromSameUser && isVeryClose
        })
        
        if (duplicateIndex !== -1) {
          // FIX: Thêm vào Set để tránh check lại
          if (newMessageId && !newMessageId.startsWith('temp_')) {
            messageIdsSetRef.current.add(newMessageId)
            processingMessagesRef.current.delete(newMessageId)
          }
          return prev
        }
        
        // BƯỚC 4: Thêm message mới nếu không tìm thấy duplicate
        // FIX: Thêm messageId vào Set TRƯỚC khi thêm vào state (để tránh race condition)
        if (newMessageId && !newMessageId.startsWith('temp_')) {
          messageIdsSetRef.current.add(newMessageId)
          processingMessagesRef.current.delete(newMessageId)
        }
        
        return [...prev, data.message]
      })
      
      // Scroll to bottom sau khi thêm message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }

    const handleUserTyping = (data) => {
      if (data.userId !== user?._id) {
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
      // Handle user joined
    }

    const handleUserLeft = (data) => {
      // Handle user left
    }

    socket.on('new_message', handleNewMessage)
    socket.on('user_typing_conversation', handleUserTyping)
    socket.on('user_joined_conversation', handleUserJoined)
    socket.on('user_left_conversation', handleUserLeft)

    return () => {
      // FIX: Cleanup socket event listeners khi component unmount hoặc dependencies thay đổi
      socket.off('new_message', handleNewMessage)
      socket.off('user_typing_conversation', handleUserTyping)
      socket.off('user_joined_conversation', handleUserJoined)
      socket.off('user_left_conversation', handleUserLeft)
    }
  }, [socket, user]) // FIX: Không thêm selectedConversation vào deps để tránh re-subscribe (sử dụng ref)

  // Auto scroll to bottom - FIX: Chỉ scroll khi thực sự cần thiết
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    // Chỉ scroll nếu:
    // 1. Messages tăng (tin nhắn mới được thêm)
    // 2. User đang ở gần cuối scroll hoặc chưa scroll
    if (messages.length > lastMessagesLengthRef.current) {
      // Tin nhắn mới được thêm
      const messagesContainer = messagesEndRef.current?.parentElement
      if (messagesContainer) {
        const isNearBottom = 
          messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 200
        
        if (isNearBottom || messages.length === 1) {
          // Chỉ scroll nếu user đang ở gần cuối hoặc là tin nhắn đầu tiên
          setTimeout(() => {
            scrollToBottom()
          }, 100)
        }
      }
    }
    
    lastMessagesLengthRef.current = messages.length
  }, [messages.length]) // FIX: Chỉ trigger khi length thay đổi, không phải toàn bộ messages array

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket || !selectedConversation) return

    try {
      // FIX: Đơn giản hóa - loại bỏ phân biệt role, chỉ dùng userId
      // Thêm tin nhắn vào state ngay lập tức (Optimistic UI)
      const tempMessage = {
        messageId: `temp_${Date.now()}`,
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
      
      // FIX: Chiến lược B - Thêm temp message vào state (Optimistic UI)
      // Lưu ý: Khi nhận lại từ socket, logic deduplication sẽ thay thế temp message
      setMessages(prev => [...prev, tempMessage])
      scrollToBottom()

      // Send via socket for real-time
      const convId = selectedConversation.conversationId || selectedConversation._id
      socket.emit('send_message', {
        conversationId: convId,
        content: newMessage.trim(),
        messageType: 'text'
      })

      setNewMessage('')
      
      // Stop typing indicator
      if (socket) {
        const convId = selectedConversation.conversationId || selectedConversation._id
        socket.emit('typing_stop', { conversationId: convId })
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

      // FIX: Đơn giản hóa - loại bỏ phân biệt role, chỉ dùng userId
      // Thêm tin nhắn ảnh vào state ngay lập tức (Optimistic UI)
      const tempImageMessage = {
        messageId: `temp_${Date.now()}`,
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
      
      // FIX: Chiến lược B - Thêm temp image message vào state (Optimistic UI)
      setMessages(prev => [...prev, tempImageMessage])
      scrollToBottom()

      // Send image message via socket
      const convId = selectedConversation.conversationId || selectedConversation._id
      socket.emit('send_message', {
        conversationId: convId,
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
      const convId = selectedConversation.conversationId || selectedConversation._id
      socket.emit('typing_start', { conversationId: convId })
    }

    // Stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      const convId = selectedConversation.conversationId || selectedConversation._id
      socket.emit('typing_stop', { conversationId: convId })
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
        <div className="flex h-[83vh]">
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
                        {conversation.user?.name?.charAt(0)?.toUpperCase() || conversation.user?.email?.charAt(0)?.toUpperCase() || 'U'}
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
                      {selectedConversation.user?.name?.charAt(0)?.toUpperCase() || selectedConversation.user?.email?.charAt(0)?.toUpperCase() || 'U'}
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
                      {messages.map((message, index) => {
                        // FIX #7: Tạo key unique cho mỗi message để React render đúng
                        // VẤN ĐỀ: Nếu có duplicate messageId, React có thể render sai hoặc warning
                        // GIẢI PHÁP: Sử dụng messageId + index để đảm bảo unique
                        // Lưu ý: Nếu messageId là ObjectId, convert sang string
                        const messageIdStr = String(message.messageId || `temp_${index}`)
                        const uniqueKey = `${messageIdStr}_${index}`
                        
                        // FIX: Đơn giản hóa - chỉ so sánh userId để xác định tin nhắn của mình
                        // - Tin do current user gửi (fromUser.userId === current userId) → hiển thị bên phải
                        // - Tin từ user khác (fromUser.userId !== current userId) → hiển thị bên trái
                        const isFromCurrentUser = message.fromUser && message.fromUser.userId?.toString() === user._id?.toString();
                        
                  // FIX: Render message với key unique
                  // Tham khảo ChatWidget.jsx line 408: `key={message.messageId || message._id || `msg_${Date.now()}`}`
                  // Ta sử dụng uniqueKey để đảm bảo unique ngay cả khi có duplicate messageId
                  return (
                    <div
                      key={uniqueKey}
                      className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isFromCurrentUser
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
                                isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
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
