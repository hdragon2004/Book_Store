import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../services/apiService';

const ChatWidget = () => {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [supportUser, setSupportUser] = useState(null); // Staff hoặc Admin
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    if (!token) {
      return;
    }

    const newSocket = io('http://localhost:5000', {
      auth: {
        token: token
      }
    });

    newSocket.on('connect', () => {
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      // Handle disconnect
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ ChatWidget: Connection error:', error);
      setError('Không thể kết nối đến server chat');
    });

    return () => {
      newSocket.close();
    };
  }, [token]);

  // Get or create conversation
  useEffect(() => {
    const getConversation = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await chatAPI.getOrCreateConversation();
        const { conversationId, adminUser, staffUser } = response.data.data;
        setConversationId(conversationId);
        setSupportUser(staffUser || adminUser); // Ưu tiên staff, fallback admin
        
        // Load messages
        await loadMessages(conversationId);
      } catch (error) {
        console.error('❌ ChatWidget: Error getting conversation:', error);
        setError('Không thể tải cuộc trò chuyện');
      } finally {
        setLoading(false);
      }
    };

    if (user && isOpen) {
      getConversation();
    }
  }, [user, isOpen]);

  // Join conversation when socket is ready
  useEffect(() => {
    if (socket && conversationId) {
      socket.emit('join_conversation', conversationId);
    }
  }, [socket, conversationId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      // Check if message belongs to current conversation
      // So sánh chính xác conversationId
      if (data.conversationId && conversationId && data.conversationId !== conversationId) {
        return;
      }
      
      // Nếu không có conversationId hoặc conversationId trùng khớp, tiếp tục xử lý
      
      const isTempMessage = data.message?.messageId?.startsWith('temp_');
      if (isTempMessage) {
        return;
      }
      
      setMessages(prev => {
        // FIX: Đơn giản hóa - loại bỏ phân biệt role, chỉ dùng userId
        // Tìm temp message để thay thế
        const tempMessageIndex = prev.findIndex(msg => 
          msg.messageId?.startsWith('temp_') && 
          msg.text === data.message.text &&
          msg.fromUser?.userId === data.message.fromUser?.userId
        );
        if (tempMessageIndex !== -1) {
          const newMessages = [...prev];
          newMessages[tempMessageIndex] = data.message;
          return newMessages;
        }
        // Kiểm tra duplicate bằng messageId
        const exists = prev.some(msg => msg.messageId === data.message.messageId);
        if (exists) {
          return prev;
        }
        return [...prev, data.message];
      });
      scrollToBottom();
    };

    const handleUserTyping = (data) => {
      if (data.userId !== user._id) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          if (data.isTyping) {
            return [...filtered, { userId: data.userId, userName: data.userName }];
          }
          return filtered;
        });
      }
    };

    const handleUserJoined = (data) => {
      // Handle user joined
    };

    const handleUserLeft = (data) => {
      // Handle user left
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing_conversation', handleUserTyping);
    socket.on('user_joined_conversation', handleUserJoined);
    socket.on('user_left_conversation', handleUserLeft);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing_conversation', handleUserTyping);
      socket.off('user_joined_conversation', handleUserJoined);
      socket.off('user_left_conversation', handleUserLeft);
    };
  }, [socket, conversationId, user]);

  // Load messages
  const loadMessages = async (convId) => {
    try {
      const response = await chatAPI.getUserConversationMessages(convId, 1, 1000);
      setMessages(response.data.data.messages || []);
    } catch (error) {
      console.error('❌ ChatWidget: Error loading messages:', error);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !conversationId) return;

    try {
      // FIX: Đơn giản hóa - loại bỏ phân biệt role, chỉ dùng userId
      // Add message to UI immediately (Optimistic UI)
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
        toUser: supportUser ? {
          userId: supportUser.userId,
          name: supportUser.name,
          email: supportUser.email,
          avatar: supportUser.avatar
        } : null
      };
      
      setMessages(prev => [...prev, tempMessage]);
      scrollToBottom();

      // Send via socket
      socket.emit('send_message', {
        conversationId,
        content: newMessage.trim(),
        messageType: 'text'
      });

      setNewMessage('');
      if (socket) socket.emit('typing_stop', { conversationId });
    } catch (error) {
      console.error('❌ ChatWidget: Error sending message:', error);
      setError('Không thể gửi tin nhắn');
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { 
      setError('Chỉ được gửi file ảnh'); 
      return; 
    }
    if (file.size > 5 * 1024 * 1024) { 
      setError('Kích thước ảnh không được vượt quá 5MB'); 
      return; 
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      const uploadResponse = await chatAPI.uploadImage(formData);
      const imageUrl = uploadResponse.data.data.imageUrl;
      socket.emit('send_message', { 
        conversationId, 
        content: 'Đã gửi ảnh', 
        messageType: 'image', 
        imageUrl 
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('❌ ChatWidget: Error uploading image:', error);
      setError('Không thể tải ảnh lên');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !conversationId) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing_start', { conversationId });
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing_stop', { conversationId });
    }, 2000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className="group relative text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          style={{ backgroundColor: '#8B5E34' }}
          title="Hỗ trợ trực tuyến"
        >
          {/* Chat Icon */}
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
          
          {/* Tooltip */}
          {/* <div className="absolute bottom-full right-0 mb-2 px-3 py-2 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap" style={{ backgroundColor: 'rgba(17,24,39,0.9)' }}>
            Hỗ trợ trực tuyến
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div> */}
        </button>
      </div>

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-80 h-96 rounded-lg shadow-2xl border border-gray-200 flex flex-col animate-in slide-in-from-bottom-2 duration-300" style={{ backgroundColor: 'rgba(255,255,255,0.96)' }}>
          {/* Header */}
          <div className="text-white p-4 rounded-t-lg flex items-center justify-between" style={{ backgroundColor: 'rgba(139,94,52,0.95)' }}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Hỗ trợ khách hàng</h3>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>Trực tuyến</p>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#8B5E34' }}></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 text-sm">
                <p>❌ {error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-2 px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700"
                >
                  Thử lại
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm">
                <p>Chào mừng bạn đến với hỗ trợ khách hàng!</p>
                <p className="mt-1">Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  // Logic hiển thị tin nhắn cho USER:
                  // - Tin do user gửi (fromId === userId) → hiển thị bên phải
                  // - Tin từ admin/staff (fromId !== userId) → hiển thị bên trái
                  const isFromCurrentUser = message.fromUser && message.fromUser.userId?.toString() === user._id?.toString();
                  
                  return (
                    <div
                      key={message.messageId || message._id || `msg_${Date.now()}`}
                      className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        isFromCurrentUser ? 'text-white' : 'text-gray-900'
                      }`} style={{ backgroundColor: isFromCurrentUser ? '#8B5E34' : 'rgba(243,244,246,0.9)' }}>
                        {message.messageType === 'image' ? (
                          <div>
                            {message.imageUrl ? (
                              <img 
                                src={message.imageUrl.startsWith('http') ? message.imageUrl : `http://localhost:5000${message.imageUrl}`}
                                alt="Uploaded image" 
                                className="max-w-full h-auto rounded mb-2" 
                                style={{ maxHeight: '200px' }} 
                              />
                            ) : (
                              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
                                <div className="text-gray-500 text-sm">📷 Ảnh không khả dụng</div>
                              </div>
                            )}
                            <p className="text-sm">{message.text}</p>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-line">{message.text}</p>
                        )}
                        <p className={`text-xs mt-1 ${
                          isFromCurrentUser ? '' : 'text-gray-500'
                        }`} style={{ color: isFromCurrentUser ? 'rgba(255,255,255,0.75)' : undefined }}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-3 py-2 rounded-lg">
                      <p className="text-sm text-gray-500">{typingUsers.map(u => u.userName).join(', ')} đang nhập...</p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!socket?.connected || uploadingImage}
                className="p-2 text-gray-500 transition-colors disabled:opacity-50"
              >
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#8B5E34' }}></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                style={{ boxShadow: '0 0 0 2px rgba(139,94,52,0.15)' }}
                disabled={!socket?.connected || uploadingImage}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || !socket?.connected || uploadingImage}
                className="p-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#8B5E34' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;