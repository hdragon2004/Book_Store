import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBookStatus } from '../contexts/BookStatusContext';
import { cartAPI, orderAPI } from '../services/apiService';
import PageLayout from '../layouts/PageLayout';

const CartPage = () => {
  const { user } = useAuth();
  const { refreshData } = useBookStatus();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCart(response.data.data.cart);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Có lỗi xảy ra khi tải giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (bookId, newQuantity) => {
    try {
      const response = await cartAPI.updateCartItem(bookId, newQuantity);
      setCart(response.data.data.cart);
      // Refresh BookStatusContext để đồng bộ state
      refreshData();
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Có lỗi xảy ra khi cập nhật số lượng');
    }
  };

  const handleRemoveItem = async (bookId) => {
    try {
      const response = await cartAPI.removeFromCart(bookId);
      setCart(response.data.data.cart);
      // Refresh BookStatusContext để đồng bộ state
      refreshData();
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Có lỗi xảy ra khi xóa sách khỏi giỏ hàng');
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả sách khỏi giỏ hàng?')) {
      try {
        const response = await cartAPI.clearCart();
        setCart(response.data.data.cart);
        setSelectedItems(new Set()); // Reset selected items
        // Refresh BookStatusContext để đồng bộ state
        refreshData();
      } catch (error) {
        console.error('Error clearing cart:', error);
        alert('Có lỗi xảy ra khi xóa giỏ hàng');
      }
    }
  };

  // Xử lý chọn/bỏ chọn sản phẩm
  const handleSelectItem = (bookId) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(bookId)) {
        newSelected.delete(bookId);
      } else {
        newSelected.add(bookId);
      }
      return newSelected;
    });
  };

  // Chọn tất cả sản phẩm
  const handleSelectAll = () => {
    const validItems = cartItems.map(item => item.bookId._id);
    setSelectedItems(new Set(validItems));
  };

  // Bỏ chọn tất cả sản phẩm
  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  };

  // Xử lý thanh toán
  const handleCheckout = () => {
    if (selectedItemsCount === 0) {
      alert('Vui lòng chọn sản phẩm để thanh toán');
      return;
    }

    // Lấy sản phẩm đã chọn
    const selectedBooks = cartItems.filter(item => selectedItems.has(item.bookId._id));
    
    // Chuyển đến OrderPage với dữ liệu đã chọn
    navigate('/order', {
      state: {
        selectedItems: selectedBooks
      }
    });
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Vui lòng đăng nhập</h2>
            <p className="text-gray-600 mb-8 text-lg">Bạn cần đăng nhập để xem giỏ hàng</p>
            <Link 
              to="/login" 
              className="inline-flex items-center bg-amber-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Đang tải giỏ hàng...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-6">⚠️</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Có lỗi xảy ra</h2>
            <p className="text-gray-600 mb-8 text-lg">{error}</p>
            <button 
              onClick={fetchCart}
              className="inline-flex items-center bg-amber-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Thử lại
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const cartItems = (cart?.items || []).filter(item => item.bookId && item.bookId._id);
  const totalItems = cartItems.length;
  
  // Tính giá cho các sản phẩm được chọn
  const selectedItemsData = cartItems.filter(item => selectedItems.has(item.bookId._id));
  const selectedTotalPrice = selectedItemsData.reduce((total, item) => {
    return total + (item.bookId.price * item.quantity);
  }, 0);
  const selectedItemsCount = selectedItemsData.length;

  return (
    <PageLayout>
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Giỏ hàng</h1>
            <p className="text-xl text-gray-600">
              {totalItems > 0 
                ? `Bạn có ${totalItems} sản phẩm trong giỏ hàng${selectedItemsCount > 0 ? ` (${selectedItemsCount} sản phẩm được chọn)` : ''}`
                : 'Giỏ hàng của bạn đang trống'
              }
            </p>
          </div>

          {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-8 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-6">
                        <h2 className="text-xl font-semibold text-gray-900">Sản phẩm</h2>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={handleSelectAll}
                            className="text-amber-600 hover:text-amber-700 text-sm font-medium transition-colors"
                          >
                            Chọn tất cả
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={handleDeselectAll}
                            className="text-gray-600 hover:text-gray-700 text-sm font-medium transition-colors"
                          >
                            Bỏ chọn tất cả
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={handleClearCart}
                        className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    {cartItems.map((item, index) => (
                      <div 
                        key={item.bookId?._id || `item-${index}`} 
                        className={`p-8 transition-all duration-300 border-l-4 ${
                          selectedItems.has(item.bookId._id) 
                            ? 'bg-amber-50 border-amber-400' 
                            : 'bg-white border-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-6">
                          {/* Checkbox */}
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.bookId._id)}
                              onChange={() => handleSelectItem(item.bookId._id)}
                              className="h-5 w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                            />
                          </div>
                          
                          {/* Book Image */}
                          <div className="flex-shrink-0">
                            <div className="h-24 w-20 bg-gray-100 rounded-xl flex items-center justify-center shadow-sm">
                              {item.bookId?.imageUrl ? (
                                <img 
                                  src={item.bookId.imageUrl.startsWith('http') ? item.bookId.imageUrl : `http://localhost:5000${item.bookId.imageUrl}`} 
                                  alt={item.bookId?.title || 'Book'}
                                  className="h-full w-full object-cover rounded-xl"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) {
                                      e.target.nextSibling.style.display = 'block';
                                    }
                                  }}
                                />
                              ) : null}
                              <div className="text-gray-400 text-xs text-center" style={{ display: item.bookId?.imageUrl ? 'none' : 'block' }}>
                                <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span>No Image</span>
                              </div>
                            </div>
                          </div>

                          {/* Book Details */}
                          <div className="flex-1 min-w-0">
                            <Link 
                              to={`/books/${item.bookId?._id || '#'}`}
                              className="text-xl font-semibold text-gray-900 hover:text-amber-600 transition-colors"
                            >
                              {item.bookId?.title || 'Không có tên sách'}
                            </Link>
                            <p className="text-base text-gray-600 mt-2">{item.bookId?.author || 'Không có tác giả'}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {item.bookId?.categoryId?.name || 'Không có danh mục'}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => item.bookId?._id && handleUpdateQuantity(item.bookId._id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || !item.bookId?._id}
                              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-12 text-center font-semibold text-lg">{item.quantity}</span>
                            <button
                              onClick={() => item.bookId?._id && handleUpdateQuantity(item.bookId._id, item.quantity + 1)}
                              disabled={item.quantity >= (item.bookId?.stock || 0) || !item.bookId?._id}
                              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">
                              {item.bookId?.price ? ((item.bookId.price * item.quantity).toLocaleString('vi-VN') + ' ₫') : 'Không có giá'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {item.bookId?.price ? (item.bookId.price.toLocaleString('vi-VN') + ' ₫ × ' + item.quantity) : 'Không có giá'}
                            </p>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => item.bookId?._id && handleRemoveItem(item.bookId._id)}
                            disabled={!item.bookId?._id}
                            className="text-red-500 hover:text-red-700 p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Xóa khỏi giỏ hàng"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>



              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sticky top-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Tóm tắt đơn hàng</h3>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-lg">Tạm tính ({selectedItemsCount} sản phẩm được chọn)</span>
                      <span className="font-semibold text-lg">{selectedTotalPrice.toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-lg">Phí vận chuyển</span>
                      <span className="font-semibold text-lg">0 ₫</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between">
                        <span className="text-xl font-bold text-gray-900">Tổng cộng</span>
                        <span className="text-xl font-bold text-gray-900">{selectedTotalPrice.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  </div>

                  {selectedItemsCount > 0 ? (
                    <button 
                      onClick={handleCheckout}
                      disabled={checkoutLoading}
                      className="w-full bg-amber-600 text-white py-4 px-6 rounded-full text-lg font-semibold hover:bg-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {checkoutLoading ? 'Đang xử lý...' : `Tiến hành thanh toán (${selectedItemsCount} sản phẩm)`}
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="w-full bg-gray-300 text-gray-500 py-4 px-6 rounded-full text-lg font-semibold cursor-not-allowed"
                    >
                      Vui lòng chọn sản phẩm để thanh toán
                    </button>
                  )}
                  
                  <Link 
                    to="/"
                    state={{ fromCart: true }}
                    className="block w-full text-center mt-6 text-amber-600 hover:text-amber-700 font-semibold text-lg transition-colors"
                  >
                    Tiếp tục mua sắm
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-gray-400 text-8xl mb-8">🛒</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Giỏ hàng trống</h3>
              <p className="text-xl text-gray-600 mb-8">Hãy thêm những cuốn sách bạn yêu thích vào giỏ hàng</p>
              <Link 
                to="/"
                state={{ fromCart: true }}
                className="inline-flex items-center bg-amber-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Khám phá sách
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default CartPage;
