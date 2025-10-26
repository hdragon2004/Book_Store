import React, { useState, useEffect } from 'react';
import { messageAPI } from '../../services/apiService';

const ChatsPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await messageAPI.getMessages();
        setMessages(response.data.messages || response.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        // Fallback to mock data if API fails
        setMessages([
          {
            _id: '1',
            sender: { name: 'Admin Support', email: 'support@bookee.com' },
            receiver: { name: 'Nguyễn Văn A', email: 'nguyenvana@email.com' },
            content: 'Chào bạn! Tôi có thể giúp gì cho bạn?',
            timestamp: '2024-01-15T10:30:00Z',
            isRead: true
          },
          {
            _id: '2',
            sender: { name: 'Nguyễn Văn A', email: 'nguyenvana@email.com' },
            receiver: { name: 'Admin Support', email: 'support@bookee.com' },
            content: 'Tôi muốn hỏi về đơn hàng #12345',
            timestamp: '2024-01-15T10:32:00Z',
            isRead: false
          }
        ]);
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const messageData = {
        receiverId: selectedChat._id,
        content: newMessage.trim()
      };
      
      await messageAPI.sendMessage(messageData);
      setNewMessage('');
      
      // Refresh messages
      const response = await messageAPI.getMessages();
      setMessages(response.data.messages || response.data || []);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Có lỗi xảy ra khi gửi tin nhắn!');
    }
  };

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
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tin nhắn</h1>
              <p className="text-gray-600 mt-1">Quản lý tin nhắn và hỗ trợ khách hàng</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {messages.length} cuộc trò chuyện
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Tin nhắn mới
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-96">
          {/* Chat List */}
          <div className="w-1/3 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Cuộc trò chuyện</h3>
            </div>
            <div className="overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Chưa có tin nhắn nào
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      onClick={() => setSelectedChat(message)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedChat?._id === message._id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {message.sender?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {message.sender?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {message.content}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTime(message.timestamp)}
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
            {selectedChat ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {selectedChat.sender?.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {selectedChat.sender?.name || 'Unknown'}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {selectedChat.sender?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex justify-start">
                      <div className="max-w-xs lg:max-w-md">
                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                          <p className="text-sm text-gray-900">{selectedChat.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(selectedChat.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
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
