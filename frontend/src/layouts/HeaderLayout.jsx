import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HeaderLayout = () => {
  const { user, logout, isAdminOrStaff } = useAuth();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [cartItems, setCartItems] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Cập nhật giỏ hàng
  React.useEffect(() => {
    const updateCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        setCartItems(totalItems);
        setCartTotal(totalPrice);
      } catch (error) {
        setCartItems(0);
        setCartTotal(0);
      }
    };

    updateCart();
    const interval = setInterval(updateCart, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserDropdownOpen(false);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  // Đóng dropdown khi click outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserDropdownOpen && !event.target.closest('.user-dropdown')) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserDropdownOpen]);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo - Left */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-gray-900">
              BOOKSTORE
            </Link>
          </div>

          {/* Navigation Menu - Center */}
          <nav className="flex-1 flex justify-center">
            <div className="flex items-center space-x-8">
              <Link 
                to="/" 
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/' || location.pathname.startsWith('/home')
                    ? 'text-orange-500 border-b-2 border-orange-500 pb-1' 
                    : 'text-gray-700 hover:text-orange-500'
                }`}
              >
                TRANG CHỦ
              </Link>
              <Link 
                to="/books" 
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/books') || location.pathname.startsWith('/book')
                    ? 'text-orange-500 border-b-2 border-orange-500 pb-1' 
                    : 'text-gray-700 hover:text-orange-500'
                }`}
              >
                TOÀN BỘ SÁCH
              </Link>
              <Link 
                to="/about" 
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/about' 
                    ? 'text-orange-500 border-b-2 border-orange-500 pb-1' 
                    : 'text-gray-700 hover:text-orange-500'
                }`}
              >
                VỀ CHÚNG TÔI
              </Link>
              <Link 
                to="/news" 
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/news' 
                    ? 'text-orange-500 border-b-2 border-orange-500 pb-1' 
                    : 'text-gray-700 hover:text-orange-500'
                }`}
              >
                TIN TỨC
              </Link>
              <Link 
                to="/contact" 
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/contact' 
                    ? 'text-orange-500 border-b-2 border-orange-500 pb-1' 
                    : 'text-gray-700 hover:text-orange-500'
                }`}
              >
                LIÊN HỆ
              </Link>
            </div>
          </nav>

          {/* Search Bar + Icons - Right */}
          <div className="flex-shrink-0 flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-64 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-orange-500 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {cartItems}
                </span>
              )}
            </Link>

            {/* User Icon */}
            {user ? (
              <div className="relative user-dropdown">
                <button
                  onClick={toggleUserDropdown}
                  className="p-2 text-gray-700 hover:text-orange-500 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Hồ sơ</Link>
                      <Link to="/favorites" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Yêu thích</Link>
                      <Link to="/library" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Thư viện</Link>
                      <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Đơn hàng</Link>
                      <Link to="/chat" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Hỗ trợ</Link>
                      {isAdminOrStaff && (
                        <Link to="/admin/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Quản trị</Link>
                      )}
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="p-2 text-gray-700 hover:text-orange-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}
            
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderLayout;
