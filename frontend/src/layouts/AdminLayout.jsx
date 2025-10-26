import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminLayout = ({ children }) => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Show loading if user data is not ready
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải người dùng...</p>
        </div>
      </div>
    );
  }

  // Show error if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600 mb-4">Bạn cần đăng nhập để truy cập trang quản trị</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const menuItems = [
    { name: 'Bảng điều khiển', path: '/admin/dashboard', icon: '📊' },
    { name: 'Quản lý sách', path: '/admin/books', icon: '📚' },
    { name: 'Danh mục', path: '/admin/categories', icon: '📂' },
    { name: 'Đơn hàng', path: '/admin/orders', icon: '🛒' },
    { name: 'Thanh toán', path: '/admin/payments', icon: '💳' },
    { name: 'Người dùng', path: '/admin/users', icon: '👥' },
    { name: 'Hỗ trợ', path: '/admin/tickets', icon: '🎫' },
    { name: 'Voucher', path: '/admin/vouchers', icon: '🎟️' },
    { name: 'Tin nhắn', path: '/admin/chat', icon: '💬' },
    { name: 'Báo cáo', path: '/admin/reports', icon: '📈' },
  ];

  const isActivePath = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-40 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            {!sidebarCollapsed && (
              <span className="ml-3 text-xl font-bold text-gray-900">BOOKEE ADMIN</span>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6">
          {menuItems.map((item) => (
            <div key={item.name} className="px-4 py-2">
              <button
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActivePath(item.path)
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="ml-3 font-medium">{item.name}</span>
                    <span className="ml-auto">→</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </nav>

        {/* Bottom Buttons */}
        <div className="absolute bottom-16 left-4 right-4 space-y-2">
          {/* Home Button */}
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center px-3 py-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
          >
            <span className="text-lg">🏠</span>
            {!sidebarCollapsed && <span className="ml-3 font-medium">Trang chủ</span>}
          </button>
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <span className="text-lg">🚪</span>
            {!sidebarCollapsed && <span className="ml-3 font-medium">Đăng xuất</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {(location.pathname === '/admin' || location.pathname === '/admin/dashboard') && 'Bảng điều khiển'}
                  {location.pathname === '/admin/books' && 'Quản lý sách'}
                  {location.pathname === '/admin/books/create' && 'Thêm sách mới'}
                  {location.pathname.startsWith('/admin/books/update/') && 'Cập nhật sách'}
                  {location.pathname.startsWith('/admin/books/') && location.pathname !== '/admin/books' && !location.pathname.includes('create') && !location.pathname.includes('update') && 'Chi tiết sách'}
                  {location.pathname === '/admin/categories' && 'Quản lý danh mục'}
                  {location.pathname === '/admin/categories/create' && 'Thêm danh mục mới'}
                  {location.pathname.startsWith('/admin/categories/update/') && 'Cập nhật danh mục'}
                  {location.pathname.startsWith('/admin/categories/') && location.pathname !== '/admin/categories' && !location.pathname.includes('create') && !location.pathname.includes('update') && 'Chi tiết danh mục'}
                  {location.pathname === '/admin/orders' && 'Quản lý đơn hàng'}
                  {location.pathname === '/admin/payments' && 'Quản lý thanh toán'}
                  {location.pathname === '/admin/users' && 'Quản lý người dùng'}
                  {location.pathname.startsWith('/admin/reports') && 'Báo cáo'}
                  {location.pathname === '/admin/vouchers' && 'Quản lý voucher'}
                  {location.pathname === '/admin/vouchers/create' && 'Tạo voucher mới'}
                  {location.pathname.startsWith('/admin/vouchers/update/') && 'Cập nhật voucher'}
                  {location.pathname === '/admin/tickets' && 'Quản lý hỗ trợ'}
                  {location.pathname === '/admin/chats' && 'Tin nhắn'}
                </h1>
                <p className="text-sm text-gray-500">
                  {(location.pathname === '/admin' || location.pathname === '/admin/dashboard') && 'Tổng quan về cửa hàng sách của bạn'}
                  {location.pathname === '/admin/books' && 'Quản lý danh sách sách trong cửa hàng'}
                  {location.pathname === '/admin/books/create' && 'Điền thông tin sách để thêm vào hệ thống'}
                  {location.pathname.startsWith('/admin/books/update/') && 'Chỉnh sửa thông tin sách trong hệ thống'}
                  {location.pathname.startsWith('/admin/books/') && location.pathname !== '/admin/books' && !location.pathname.includes('create') && !location.pathname.includes('update') && 'Thông tin chi tiết về sách'}
                  {location.pathname === '/admin/categories' && 'Quản lý các danh mục sách trong cửa hàng'}
                  {location.pathname === '/admin/categories/create' && 'Điền thông tin danh mục để thêm vào hệ thống'}
                  {location.pathname.startsWith('/admin/categories/update/') && 'Chỉnh sửa thông tin danh mục trong hệ thống'}
                  {location.pathname.startsWith('/admin/categories/') && location.pathname !== '/admin/categories' && !location.pathname.includes('create') && !location.pathname.includes('update') && 'Thông tin chi tiết về danh mục'}
                  {location.pathname === '/admin/orders' && 'Theo dõi và quản lý tất cả đơn hàng'}
                  {location.pathname === '/admin/payments' && 'Theo dõi và quản lý các giao dịch thanh toán'}
                  {location.pathname === '/admin/users' && 'Quản lý tài khoản người dùng trong hệ thống'}
                  {location.pathname.startsWith('/admin/reports') && 'Xem báo cáo và thống kê chi tiết'}
                  {location.pathname === '/admin/vouchers' && 'Quản lý mã giảm giá và voucher'}
                  {location.pathname === '/admin/vouchers/create' && 'Tạo mã giảm giá mới cho khách hàng'}
                  {location.pathname.startsWith('/admin/vouchers/update/') && 'Chỉnh sửa thông tin voucher'}
                  {location.pathname === '/admin/tickets' && 'Xử lý các yêu cầu hỗ trợ từ khách hàng'}
                  {location.pathname === '/admin/chats' && 'Quản lý tin nhắn và trò chuyện'}
                </p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Quản trị viên'}</p>
                  <p className="text-xs text-gray-500">Quản trị viên</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
