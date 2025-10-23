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
  // Get all orders
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


// Export all APIs
export default {
  auth: authAPI,
  user: userAPI,
  book: bookAPI,
  category: categoryAPI,
  order: orderAPI,
  favorite: favoriteAPI,
  cart: cartAPI
};
