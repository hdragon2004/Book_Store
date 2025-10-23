import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HeaderLayout = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState(0); // Số lượng sản phẩm trong giỏ hàng
  const navigate = useNavigate();

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  React.useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartItems(totalItems);
      } catch (error) {
        setCartItems(0);
      }
    };

    updateCartCount();
    
    // Lắng nghe sự kiện storage change để cập nhật real-time
    const handleStorageChange = () => updateCartCount();
    window.addEventListener('storage', handleStorageChange);
    
    // Cập nhật khi component mount
    const interval = setInterval(updateCartCount, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <>
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        {/* Top Header Section */}
        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-800">
                <span className="text-blue-600">B</span>
                <span className="text-blue-400">O</span>
                <span className="text-blue-600">O</span>
                <span className="text-blue-800">K</span>
                <span className="text-blue-600">E</span>
                <span className="text-blue-400">E</span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="bg-white rounded-full shadow-lg flex items-center px-4 py-2">
                <input
                  type="text"
                  placeholder="Tìm sách theo từ khóa..."
                  className="flex-1 text-gray-600 border-none outline-none bg-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-4">
              {/* Favorites */}
              {user && (
                <Link to="/favorites" className="relative cursor-pointer group">
                  <div className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-6 h-6 text-gray-700 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </Link>
              )}

              {/* Cart */}
              {user && (
                <Link to="/cart" className="relative cursor-pointer group">
                  <div className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-6 h-6 text-gray-700 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                    {/* Chỉ hiện chấm đỏ khi có hàng trong giỏ */}
                    {cartItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                        {cartItems}
                      </span>
                    )}
                  </div>
                </Link>
              )}

              {/* Login/Register */}
              {user ? (
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-blue-600 text-sm font-medium"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link 
                    to="/login" 
                    className="text-gray-600 hover:text-blue-600 text-sm font-medium"
                  >
                    Đăng nhập
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Menu - Separated and Centered */}
        <div className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-8 lg:px-12 py-3">
            <nav className="flex justify-center">
              <div className="flex items-center space-x-8">
                <Link to="/books" className="text-gray-700 hover:text-blue-600 font-medium">Tất cả sách</Link>
                <Link to="/amazon" className="text-gray-700 hover:text-blue-600 font-medium">Đặt sách Amazon</Link>
                <Link to="/preorder" className="text-gray-700 hover:text-blue-600 font-medium">PRE-ORDER</Link>
                <Link to="/sale" className="text-red-600 hover:text-red-700 font-medium flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  SALE
                </Link>
                <Link to="/reviews" className="text-gray-700 hover:text-blue-600 font-medium">Review Sách</Link>
                <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">Liên hệ</Link>
              </div>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
};

export default HeaderLayout;
