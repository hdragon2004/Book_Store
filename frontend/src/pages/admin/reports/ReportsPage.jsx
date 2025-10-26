import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/apiService';

const ReportsPage = () => {
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        // Sử dụng các API có sẵn thay vì reports API
        const [booksResponse, usersResponse, ordersResponse, paymentsResponse] = await Promise.all([
          adminAPI.getTopBooks(10), // Lấy top books
          adminAPI.getDashboardStats(), // Lấy stats users
          adminAPI.getRecentOrders(100), // Lấy orders để phân tích
          adminAPI.getDashboardStats() // Lấy revenue từ dashboard stats
        ]);

        console.log('📊 Reports API Responses:', {
          books: booksResponse.data,
          users: usersResponse.data,
          orders: ordersResponse.data,
          payments: paymentsResponse.data
        });

        // Tính toán data từ API responses
        const orders = ordersResponse.data?.orders || ordersResponse.data || [];
        const books = booksResponse.data?.books || booksResponse.data || [];
        
        // Tính tổng doanh thu từ orders
        const totalRevenue = orders.reduce((sum, order) => {
          return sum + (order.totalPrice || order.totalAmount || order.amount || 0);
        }, 0);

        // Phân loại orders theo status
        const ordersByStatus = orders.reduce((acc, order) => {
          const status = order.status || 'pending';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        // Tính top books với data thực từ API
        const topBooks = books.slice(0, 5).map((book, index) => ({
          name: book.title || book.name || `Book ${index + 1}`,
          sales: 0, // Sẽ được tính từ data thực khi có
          revenue: book.price || 0
        }));

        setReports({
          sales: {
            total: totalRevenue,
            growth: 0, // Không có data lịch sử để tính growth
            daily: [] // Không có daily data
          },
          orders: {
            total: orders.length,
            growth: 0, // Không có data lịch sử để tính growth
            status: {
              completed: ordersByStatus.completed || ordersByStatus.delivered || 0,
              pending: ordersByStatus.pending || ordersByStatus.processing || 0,
              cancelled: ordersByStatus.cancelled || ordersByStatus.canceled || 0
            }
          },
          topBooks: topBooks,
          customers: {
            new: 0, // Không có data để tính new customers
            returning: 0, // Không có data để tính returning customers
            total: usersResponse.data?.totalUsers || 0
          }
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching reports:', error);
        // Không sử dụng mock data, hiển thị empty state
        setReports({
          sales: { total: 0, growth: 0, daily: [] },
          orders: { total: 0, growth: 0, status: { completed: 0, pending: 0, cancelled: 0 } },
          topBooks: [],
          customers: { new: 0, returning: 0, total: 0 }
        });
        setLoading(false);
      }
    };
    fetchReports();
  }, [dateRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Đang tải báo cáo...</p>
      </div>
    );
  }

  // Kiểm tra nếu không có data
  if (!reports.sales && !reports.orders && !reports.topBooks && !reports.customers) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Không có dữ liệu báo cáo
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Chưa có dữ liệu để hiển thị báo cáo. Vui lòng thử lại sau.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  try {
    return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex justify-end">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7days">7 ngày qua</option>
          <option value="30days">30 ngày qua</option>
          <option value="90days">90 ngày qua</option>
          <option value="1year">1 năm qua</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reports.sales?.total || 0)}</p>
              <p className="text-sm text-green-600">+{reports.sales?.growth || 0}% so với tháng trước</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
              <p className="text-2xl font-bold text-gray-900">{reports.orders?.total || 0}</p>
              <p className="text-sm text-blue-600">+{reports.orders?.growth || 0}% so với tháng trước</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Khách hàng mới</p>
              <p className="text-2xl font-bold text-gray-900">{reports.customers?.new || 0}</p>
              <p className="text-sm text-purple-600">Trong tháng này</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tỷ lệ hoàn thành</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((reports.orders?.status?.completed / reports.orders?.total) * 100) || 0}%
              </p>
              <p className="text-sm text-yellow-600">Đơn hàng thành công</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sách bán chạy</h3>
          <div className="space-y-3">
            {reports.topBooks?.map((book, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{book.name}</p>
                    <p className="text-sm text-gray-600">{book.sales} bản đã bán</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(book.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái đơn hàng</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Hoàn thành</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(reports.orders?.status?.completed / reports.orders?.total) * 100 || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{reports.orders?.status?.completed || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Chờ xử lý</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full" 
                    style={{ width: `${(reports.orders?.status?.pending / reports.orders?.total) * 100 || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{reports.orders?.status?.pending || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Đã hủy</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${(reports.orders?.status?.cancelled / reports.orders?.total) * 100 || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{reports.orders?.status?.cancelled || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  } catch (error) {
    console.error('❌ ReportsPage render error:', error);
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Lỗi hiển thị báo cáo
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Đã xảy ra lỗi khi hiển thị báo cáo. Vui lòng thử lại.</p>
                <p className="mt-1 text-xs">Error: {error.message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default ReportsPage;
