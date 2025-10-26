import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { voucherAPI } from '../../../services/apiService';

const VouchersPage = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [vouchersPerPage] = useState(10);

  useEffect(() => {
    const fetchVouchers = async () => {
      setLoading(true);
      try {
        const response = await voucherAPI.getVouchers({
          page: currentPage,
          limit: vouchersPerPage,
          search: searchTerm,
          type: filterType !== 'all' ? filterType : undefined,
          isActive: filterStatus !== 'all' ? filterStatus === 'active' : undefined
        });
        console.log('🎫 VouchersPage API Response:', response);
        setVouchers(response?.data?.data?.vouchers || response?.data?.vouchers || response?.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching vouchers:', error);
        setVouchers([]);
        setLoading(false);
      }
    };
    fetchVouchers();
  }, [currentPage, searchTerm, filterType, filterStatus]);

  const handleStatusChange = async (voucherId, newStatus) => {
    try {
      await voucherAPI.updateVoucher(voucherId, { isActive: newStatus });
      setVouchers(vouchers.map(voucher => 
        voucher._id === voucherId ? { ...voucher, isActive: newStatus } : voucher
      ));
    } catch (error) {
      console.error('Error updating voucher status:', error);
    }
  };

  const handleDeleteVoucher = async (voucherId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa voucher này?')) {
      try {
        await voucherAPI.deleteVoucher(voucherId);
        setVouchers(vouchers.filter(voucher => voucher._id !== voucherId));
        alert('Xóa voucher thành công!');
      } catch (error) {
        console.error('Error deleting voucher:', error);
        alert('Có lỗi xảy ra khi xóa voucher!');
      }
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'percentage': return 'Phần trăm';
      case 'fixed_amount': return 'Số tiền cố định';
      case 'free_shipping': return 'Miễn phí vận chuyển';
      default: return type;
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const isExpired = (validTo) => {
    return new Date(validTo) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Đang tải voucher...</p>
      </div>
    );
  }

  // Debug: Log current state
  console.log('🎫 VouchersPage - Loading:', loading, 'Vouchers count:', vouchers.length);
  console.log('🎫 VouchersPage - Vouchers:', vouchers);

  return (
    <div className="space-y-6">

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => navigate('/admin/vouchers/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tạo voucher mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Tìm kiếm voucher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại voucher
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="percentage">Phần trăm</option>
              <option value="fixed_amount">Số tiền cố định</option>
              <option value="free_shipping">Miễn phí vận chuyển</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voucher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá trị
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sử dụng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vouchers.length > 0 ? (
                vouchers.map((voucher) => (
                <tr key={voucher._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {voucher.code}
                      </div>
                      <div className="text-sm text-gray-500">
                        {voucher.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTypeName(voucher.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {voucher.type === 'percentage' 
                      ? `${voucher.value}%` 
                      : voucher.type === 'free_shipping'
                      ? 'Miễn phí'
                      : formatCurrency(voucher.value)
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>Từ: {formatDate(voucher.validFrom)}</div>
                      <div>Đến: {formatDate(voucher.validTo)}</div>
                      {isExpired(voucher.validTo) && (
                        <span className="text-red-500 text-xs">(Đã hết hạn)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {voucher.usedCount || 0} / {voucher.usageLimit || '∞'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={voucher.isActive ? 'active' : 'inactive'}
                      onChange={(e) => handleStatusChange(voucher._id, e.target.value === 'active')}
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(voucher.isActive)} border-0 focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Không hoạt động</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/admin/vouchers/${voucher._id}`)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => navigate(`/admin/vouchers/update/${voucher._id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteVoucher(voucher._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-2">Không có voucher nào</p>
                      <p className="text-sm text-gray-500">Hãy tạo voucher mới hoặc thử lại sau</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Sau
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">1</span> đến{' '}
                <span className="font-medium">{vouchers.length}</span> trong tổng số{' '}
                <span className="font-medium">{vouchers.length}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Sau
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VouchersPage;
