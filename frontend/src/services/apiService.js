import axiosClient from './axiosClient';

// Auth API
export const authAPI = {
  // Login
  login: (email, password) => 
    axiosClient.post('/auth/login', { email, password }),

  // Register
  register: (userData) => 
    axiosClient.post('/auth/register', userData),

  // Get current user
  getCurrentUser: () => 
    axiosClient.get('/auth/me'),

  // Forgot password
  forgotPassword: (email) => 
    axiosClient.post('/auth/forgot-password', { email }),

  // Verify reset OTP
  verifyResetOTP: (email, code) => 
    axiosClient.post('/auth/verify-reset-otp', { email, code }),

  // Reset password
  resetPassword: (email, code, password) => 
    axiosClient.post('/auth/reset-password', { email, code, password }),

  // Change password
  changePassword: (currentPassword, newPassword) => 
    axiosClient.put('/auth/change-password', { currentPassword, newPassword }),

  // Send verification code
  sendVerificationCode: (email, name) => 
    axiosClient.post('/auth/send-verification-code', { email, name }),

  // Register with verification
  registerWithVerification: (userData) => 
    axiosClient.post('/auth/register-with-verification', userData),
};

// User API
export const userAPI = {
  // Get all users
  getUsers: (params = {}) => 
    axiosClient.get('/users', { params }),

  // Get user by ID
  getUser: (id) => 
    axiosClient.get(`/users/${id}`),

  // Get current user profile
  getProfile: () => 
    axiosClient.get('/users/profile'),

  // Update current user profile
  updateProfile: (userData) => 
    axiosClient.put('/users/profile', userData),

  // Upload avatar
  uploadAvatar: (formData) => 
    axiosClient.post('/users/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Update user
  updateUser: (id, userData) => 
    axiosClient.put(`/users/${id}`, userData),

  // Delete user
  deleteUser: (id) => 
    axiosClient.delete(`/users/${id}`),
};

// Book API
export const bookAPI = {
  // Get all books
  getBooks: (params = {}) => 
    axiosClient.get('/books', { params }),

  // Get book by ID
  getBook: (id) => 
    axiosClient.get(`/books/${id}`),

  // Create book
  createBook: (bookData) => 
    axiosClient.post('/books', bookData),

  // Update book
  updateBook: (id, bookData) => 
    axiosClient.put(`/books/${id}`, bookData),

  // Delete book
  deleteBook: (id) => 
    axiosClient.delete(`/books/${id}`),

  // Upload book image
  uploadBookImage: (id, formData) => 
    axiosClient.post(`/books/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Upload image (general)
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return axiosClient.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Category API
export const categoryAPI = {
  // Get all categories
  getCategories: (params = {}) => 
    axiosClient.get('/categories', { params }),

  // Get category by ID
  getCategory: (id) => 
    axiosClient.get(`/categories/${id}`),

  // Create category
  createCategory: (categoryData) => 
    axiosClient.post('/categories', categoryData),

  // Update category
  updateCategory: (id, categoryData) => 
    axiosClient.put(`/categories/${id}`, categoryData),

  // Delete category
  deleteCategory: (id) => 
    axiosClient.delete(`/categories/${id}`),
};

// Order API
export const orderAPI = {
  // Get orders (User: chỉ orders của mình, Admin: tất cả orders)
  getOrders: (params = {}) =>
    axiosClient.get('/orders', { params }),

  // Get order by ID
  getOrder: (id) => 
    axiosClient.get(`/orders/${id}`),

  // Create order
  createOrder: (orderData) => 
    axiosClient.post('/orders', orderData),

  // Update order
  updateOrder: (id, orderData) => 
    axiosClient.put(`/orders/${id}`, orderData),

  // Delete order
  deleteOrder: (id) => 
    axiosClient.delete(`/orders/${id}`),

  // Get user orders
  getUserOrders: (userId, params = {}) => 
    axiosClient.get(`/orders/user/${userId}`, { params }),

  // Cancel order
  cancelOrder: (orderId) => 
    axiosClient.patch(`/orders/${orderId}/cancel`),

  // Update order status
  updateOrderStatus: (id, status) => 
    axiosClient.patch(`/orders/admin/${id}/status`, { status }),
};

// Order Item API
export const orderItemAPI = {
  // Get all order items
  getOrderItems: (params = {}) => 
    axiosClient.get('/order-items', { params }),

  // Get order item by ID
  getOrderItem: (id) => 
    axiosClient.get(`/order-items/${id}`),

  // Create order item
  createOrderItem: (orderItemData) => 
    axiosClient.post('/order-items', orderItemData),

  // Update order item
  updateOrderItem: (id, orderItemData) => 
    axiosClient.put(`/order-items/${id}`, orderItemData),

  // Delete order item
  deleteOrderItem: (id) => 
    axiosClient.delete(`/order-items/${id}`),

  // Get order items by order ID
  getOrderItemsByOrder: (orderId, params = {}) => 
    axiosClient.get(`/order-items/order/${orderId}`, { params }),
};


// Favorite API
export const favoriteAPI = {
  // Add book to favorites
  addToFavorites: (bookId) => 
    axiosClient.post(`/favorites/${bookId}`),

  // Remove book from favorites
  removeFromFavorites: (bookId) => 
    axiosClient.delete(`/favorites/${bookId}`),

  // Get user's favorites
  getFavorites: () => 
    axiosClient.get('/favorites'),

  // Get favorites with pagination
  getFavoritesWithPagination: (params = {}) => 
    axiosClient.get('/favorites/paginated', { params }),

  // Check if book is favorite
  checkFavorite: (bookId) => 
    axiosClient.get(`/favorites/check/${bookId}`),
};

// Cart API
export const cartAPI = {
  // Get user's cart
  getCart: () => 
    axiosClient.get('/cart'),

  // Add book to cart
  addToCart: (bookId, quantity = 1) => 
    axiosClient.post(`/cart/${bookId}`, { quantity }),

  // Update cart item quantity
  updateCartItem: (bookId, quantity) => 
    axiosClient.put(`/cart/${bookId}`, { quantity }),

  // Remove book from cart
  removeFromCart: (bookId) => 
    axiosClient.delete(`/cart/${bookId}`),

  // Clear cart
  clearCart: () => 
    axiosClient.delete('/cart'),

  // Get cart summary
  getCartSummary: () => 
    axiosClient.get('/cart/summary'),

  // Check if book is in cart
  checkCartItem: (bookId) => 
    axiosClient.get(`/cart/check/${bookId}`),
};


// Admin Dashboard API - Using existing endpoints
export const adminAPI = {
  // Get dashboard statistics - using existing endpoints
  getDashboardStats: async () => {
    try {
      const [booksResponse, usersResponse, ordersResponse, paymentsResponse] = await Promise.all([
        bookAPI.getBooks(), // Lấy tất cả sách
        userAPI.getUsers(), // Lấy tất cả users
        orderAPI.getOrders(), // Lấy tất cả orders
        paymentAPI.getPayments() // Lấy tất cả payments
      ]);
      
      console.log('📊 Dashboard API Responses:', {
        books: booksResponse.data,
        users: usersResponse.data,
        orders: ordersResponse.data,
        payments: paymentsResponse.data
      });
      
      // Tính tổng doanh thu từ orders
      const orders = ordersResponse.data?.data?.orders || ordersResponse.data?.orders || ordersResponse.data || [];
      const totalRevenue = orders.reduce((sum, order) => {
        return sum + (order.totalPrice || order.totalAmount || order.amount || 0);
      }, 0);
      
      return {
        data: {
          totalBooks: booksResponse.data?.data?.books?.length || booksResponse.data?.books?.length || booksResponse.data?.total || 0,
          totalUsers: usersResponse.data?.data?.users?.length || usersResponse.data?.users?.length || usersResponse.data?.total || 0,
          totalOrders: orders.length,
          totalRevenue: totalRevenue
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        data: {
          totalBooks: 0,
          totalUsers: 0,
          totalOrders: 0,
          totalRevenue: 0
        }
      };
    }
  },

  // Get recent orders
  getRecentOrders: (limit = 5) => {
    return orderAPI.getOrders({ sortBy: 'createdAt', sortOrder: 'desc' }).then(response => {
      const orders = response.data?.data?.orders || response.data?.orders || response.data || [];
      return {
        data: {
          orders: orders.slice(0, limit)
        }
      };
    });
  },

  // Get top books
  getTopBooks: (limit = 5) => {
    return bookAPI.getBooks({ sortBy: 'createdAt', sortOrder: 'desc' }).then(response => {
      const books = response.data?.data?.books || response.data?.books || response.data || [];
      return {
        data: {
          books: books.slice(0, limit)
        }
      };
    });
  },

  // Get sales report
  getSalesReport: (params = {}) => 
    axiosClient.get('/reports/dashboard', { params }),

  // Get orders report
  getOrdersReport: (params = {}) => 
    axiosClient.get('/reports/dashboard', { params }),

  // Get users report
  getUsersReport: (params = {}) => 
    axiosClient.get('/reports/dashboard', { params }),
};

// Payment API
export const paymentAPI = {
  // Get all payments
  getPayments: (params = {}) =>
    axiosClient.get('/payments', { params }),

  // Get payment by ID
  getPayment: (id) =>
    axiosClient.get(`/payments/${id}`),

  // Update payment status
  updatePaymentStatus: (id, status) =>
    axiosClient.put(`/payments/${id}/status`, { status }),

  // Get payment statistics
  getPaymentStats: () =>
    axiosClient.get('/payments/stats'),
};


// Voucher API
export const voucherAPI = {
  // Get all vouchers
  getVouchers: (params = {}) =>
    axiosClient.get('/vouchers', { params }),

  // Get voucher by ID
  getVoucher: (id) =>
    axiosClient.get(`/vouchers/${id}`),

  // Get voucher by code
  getVoucherByCode: (code) =>
    axiosClient.get(`/vouchers/code/${code}`),

  // Create voucher (Admin only)
  createVoucher: (data) =>
    axiosClient.post('/vouchers', data),

  // Update voucher (Admin only)
  updateVoucher: (id, data) =>
    axiosClient.put(`/vouchers/${id}`, data),

  // Delete voucher (Admin only)
  deleteVoucher: (id) =>
    axiosClient.delete(`/vouchers/${id}`),

  // Check voucher validity
  checkVoucher: (data) =>
    axiosClient.post('/vouchers/check', data),

  // Get available vouchers
  getAvailableVouchers: (params = {}) =>
    axiosClient.get('/vouchers/available', { params }),
};

// Message API
export const messageAPI = {
  // Get all messages
  getMessages: (params = {}) =>
    axiosClient.get('/messages', { params }),

  // Get message by ID
  getMessage: (id) =>
    axiosClient.get(`/messages/${id}`),

  // Send new message
  sendMessage: (data) =>
    axiosClient.post('/messages', data),

  // Update message
  updateMessage: (id, data) =>
    axiosClient.put(`/messages/${id}`, data),

  // Delete message
  deleteMessage: (id) =>
    axiosClient.delete(`/messages/${id}`),

  // Mark message as read
  markAsRead: (id) =>
    axiosClient.patch(`/messages/${id}/read`),

  // Get conversation
  getConversation: (userId) =>
    axiosClient.get(`/messages/conversation/${userId}`),
};

// Library API
export const libraryAPI = {
  // Get user's library
  getMyLibrary: (params = {}) => 
    axiosClient.get('/library', { params }),

  // Get library book details
  getLibraryBook: (bookId) => 
    axiosClient.get(`/library/book/${bookId}`),

  // Get download history
  getDownloadHistory: (params = {}) => 
    axiosClient.get('/library/downloads', { params }),

  // Get library stats
  getLibraryStats: () => 
    axiosClient.get('/library/stats'),

  // Search library
  searchLibrary: (params = {}) => 
    axiosClient.get('/library/search', { params }),
};

// Download API
export const downloadAPI = {
  // Generate download link
  generateDownloadLink: (bookId) => 
    axiosClient.get(`/download/temp/${bookId}`),

  // Download file
  downloadFile: (bookId, token) => 
    axiosClient.get(`/download/file/${bookId}?token=${token}`),

  // Stream file
  streamFile: (bookId) => 
    axiosClient.get(`/download/stream/${bookId}`),

  // Get file info
  getFileInfo: (bookId) => 
    axiosClient.get(`/download/info/${bookId}`),
};

export const chatAPI = {
  // Get or create conversation
  getOrCreateConversation: () => 
    axiosClient.get('/chat/conversation'),

  // Get admin conversations
  getAdminConversations: (page = 1, limit = 10) => 
    axiosClient.get(`/chat/admin/chats?page=${page}&limit=${limit}`),

  // Get conversation info
  getConversationInfo: (conversationId) => 
    axiosClient.get(`/chat/admin/chats/${conversationId}`),

  // Get conversation messages (for admin)
  getConversationMessages: (conversationId, page = 1, limit = 50) => 
    axiosClient.get(`/chat/admin/chats/${conversationId}?page=${page}&limit=${limit}`),

  // Get conversation messages (for user)
  getUserConversationMessages: (conversationId, page = 1, limit = 50) => 
    axiosClient.get(`/chat/messages?conversationId=${conversationId}&page=${page}&limit=${limit}`),

  // Send message
  sendMessage: (messageData) => 
    axiosClient.post('/chat/messages', messageData),

  // Upload image for chat
  uploadImage: (formData) => 
    axiosClient.post('/chat/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Mark message as read
  markAsRead: (messageId) => 
    axiosClient.patch(`/chat/messages/${messageId}/read`),

  // Mark conversation as read
  markConversationAsRead: (conversationId) => 
    axiosClient.patch(`/chat/conversations/${conversationId}/read`),

  // Get unread count
  getUnreadCount: () => 
    axiosClient.get('/chat/unread-count'),
};

// Export all APIs
export default {
  auth: authAPI,
  user: userAPI,
  book: bookAPI,
  category: categoryAPI,
  order: orderAPI,
  favorite: favoriteAPI,
  cart: cartAPI,
  admin: adminAPI,
  payment: paymentAPI,
  voucher: voucherAPI,
  message: messageAPI,
  library: libraryAPI,
  download: downloadAPI,
  chat: chatAPI
};
