import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeRegistrations: 0,
    pendingNotifications: 0,
    totalUsers: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - trong thực tế sẽ fetch từ API
    setStats({
      totalEvents: 12,
      activeRegistrations: 45,
      pendingNotifications: 8,
      totalUsers: 156
    });

    setRecentActivities([
      {
        id: 1,
        type: 'event',
        title: 'Giải bóng đá sinh viên TP.HCM 2024',
        description: 'Sự kiện mới được tạo',
        time: '2 phút trước',
        status: 'active'
      },
      {
        id: 2,
        type: 'registration',
        title: 'Đăng ký thi đấu',
        description: 'Đội ABC đăng ký tham gia giải đấu',
        time: '5 phút trước',
        status: 'pending'
      },
      {
        id: 3,
        type: 'notification',
        title: 'Thông báo xác nhận',
        description: 'Gửi thông báo xác nhận cho 5 đội',
        time: '10 phút trước',
        status: 'completed'
      },
      {
        id: 4,
        type: 'permission',
        title: 'Phân quyền huấn luyện viên',
        description: 'Cấp quyền cho Nguyễn Văn B',
        time: '15 phút trước',
        status: 'completed'
      }
    ]);

    setLoading(false);
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'event':
        return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
      case 'registration':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'notification':
        return 'M15 17h5l-5 5v-5zM4.19 4H20c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4.19c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z';
      case 'permission':
        return 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#30ddff] via-blue-600 to-purple-600 px-8 py-12 relative">
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-blue-100 text-lg">Quản lý hệ thống thể thao và sự kiện</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-2xl p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Tổng sự kiện</p>
              <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-2xl p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Đăng ký thi đấu</p>
              <p className="text-2xl font-bold text-white">{stats.activeRegistrations}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-2xl p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.19 4H20c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4.19c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Thông báo chờ</p>
              <p className="text-2xl font-bold text-white">{stats.pendingNotifications}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-2xl p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Tổng người dùng</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button className="bg-gradient-to-r from-[#30ddff] to-[#00b8d4] text-white p-6 rounded-2xl hover:from-[#00b8d4] hover:to-[#30ddff] transition-all duration-300 shadow-lg">
          <div className="flex items-center">
            <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <div className="text-left">
              <h3 className="font-semibold">Tạo sự kiện</h3>
              <p className="text-sm opacity-90">Thêm sự kiện mới</p>
            </div>
          </div>
        </button>

        <button className="bg-gradient-to-r from-[#30ddff] to-[#00b8d4] text-white p-6 rounded-2xl hover:from-[#00b8d4] hover:to-[#30ddff] transition-all duration-300 shadow-lg">
          <div className="flex items-center">
            <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.19 4H20c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4.19c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            </svg>
            <div className="text-left">
              <h3 className="font-semibold">Gửi thông báo</h3>
              <p className="text-sm opacity-90">Thông báo realtime</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => navigate('/admin/coach-permissions')}
          className="bg-gradient-to-r from-[#30ddff] to-[#00b8d4] text-white p-6 rounded-2xl hover:from-[#00b8d4] hover:to-[#30ddff] transition-all duration-300 shadow-lg"
        >
          <div className="flex items-center">
            <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <div className="text-left">
              <h3 className="font-semibold">Phân quyền</h3>
              <p className="text-sm opacity-90">Quản lý quyền hạn</p>
            </div>
          </div>
        </button>

        <button className="bg-gradient-to-r from-[#30ddff] to-[#00b8d4] text-white p-6 rounded-2xl hover:from-[#00b8d4] hover:to-[#30ddff] transition-all duration-300 shadow-lg">
          <div className="flex items-center">
            <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div className="text-left">
              <h3 className="font-semibold">Lịch thi đấu</h3>
              <p className="text-sm opacity-90">Tối ưu lịch trình</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Activities */}
      <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#30ddff] via-blue-600 to-purple-600 px-6 py-4 relative">
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-white">Hoạt động gần đây</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700/70 transition-all duration-300">
                <div className="w-10 h-10 bg-gray-600/50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getActivityIcon(activity.type)} />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-white">{activity.title}</h4>
                  <p className="text-xs text-gray-400">{activity.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(activity.status)}`}>
                    {activity.status === 'active' ? 'Hoạt động' : 
                     activity.status === 'pending' ? 'Chờ xử lý' : 
                     activity.status === 'completed' ? 'Hoàn thành' : activity.status}
                  </span>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 