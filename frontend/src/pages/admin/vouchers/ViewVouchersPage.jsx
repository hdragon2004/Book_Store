import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { voucherAPI } from '../../../services/apiService';

const ViewVouchersPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        setLoading(true);
        const response = await voucherAPI.getVoucher(id);
        console.log('🎫 ViewVouchersPage - Fetched voucher:', response);
        
        const voucherData = response?.data?.data || response?.data;
        if (voucherData) {
          setVoucher(voucherData);
        } else {
          setError('Không tìm thấy voucher');
        }
        setLoading(false);
      } catch (error) {
        console.error('❌ Error fetching voucher:', error);
        setError('Lỗi khi tải thông tin voucher');
        setLoading(false);
      }
    };

    if (id) {
      fetchVoucher();
    }
  }, [id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const isExpired = (validTo) => {
    return new Date(validTo) < new Date();
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await voucherAPI.updateVoucher(id, { isActive: newStatus });
      setVoucher(prev => ({ ...prev, isActive: newStatus }));
      alert('Cập nhật trạng thái thành công!');
    } catch (error) {
      console.error('Error updating voucher status:', error);
      alert('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDeleteVoucher = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa voucher này? Hành động này không thể hoàn tác.')) {
      try {
        await voucherAPI.deleteVoucher(id);
        alert('Xóa voucher thành công!');
        navigate('/admin/vouchers');
      } catch (error) {
        console.error('Error deleting voucher:', error);
        alert('Lỗi khi xóa voucher');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin voucher...</p>
        </div>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Không tìm thấy voucher</h2>
          <p className="text-gray-600 mb-8">{error || 'Voucher không tồn tại'}</p>
          <div className="space-x-4">
            <Link 
              to="/admin/vouchers" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Quay lại danh sách
            </Link>
            <Link 
              to="/admin/dashboard" 
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Chi tiết voucher</h1>
            <p className="text-gray-600">
              Mã voucher: <span className="font-medium text-blue-600">{voucher.code}</span>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(voucher.isActive)}`}>
              {voucher.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
            </span>
            {isExpired(voucher.validTo) && (
              <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                Đã hết hạn
              </span>
            )}
            <Link 
              to="/admin/vouchers" 
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Quay lại
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Voucher Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin voucher</h2>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mã voucher</label>
                    <p className="text-lg font-semibold text-gray-900">{voucher.code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên voucher</label>
                    <p className="text-lg font-semibold text-gray-900">{voucher.name}</p>
                  </div>
                </div>

                {voucher.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                    <p className="text-gray-900">{voucher.description}</p>
                  </div>
                )}

                {/* Type and Value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại voucher</label>
                    <p className="text-lg font-semibold text-gray-900">{getTypeName(voucher.type)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giá trị</label>
                    <p className="text-lg font-semibold text-blue-600">
                      {voucher.type === 'percentage' 
                        ? `${voucher.value}%` 
                        : voucher.type === 'free_shipping'
                        ? 'Miễn phí vận chuyển'
                        : formatCurrency(voucher.value)
                      }
                    </p>
                  </div>
                </div>

                {/* Validity Period */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
                    <p className="text-gray-900">{formatDate(voucher.validFrom)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc</label>
                    <p className="text-gray-900">{formatDate(voucher.validTo)}</p>
                    {isExpired(voucher.validTo) && (
                      <p className="text-red-500 text-sm mt-1">(Đã hết hạn)</p>
                    )}
                  </div>
                </div>

                {/* Conditions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Đơn hàng tối thiểu</label>
                    <p className="text-gray-900">
                      {voucher.minOrderAmount ? formatCurrency(voucher.minOrderAmount) : 'Không có'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giảm giá tối đa</label>
                    <p className="text-gray-900">
                      {voucher.maxDiscountAmount ? formatCurrency(voucher.maxDiscountAmount) : 'Không có'}
                    </p>
                  </div>
                </div>

                {/* Usage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giới hạn sử dụng</label>
                  <p className="text-gray-900">
                    {voucher.usageLimit ? `${voucher.usedCount || 0} / ${voucher.usageLimit}` : 'Không giới hạn'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions and Info */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Status Management */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quản lý trạng thái</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái hiện tại
                  </label>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(voucher.isActive)}`}>
                    {voucher.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cập nhật trạng thái
                  </label>
                  <select
                    value={voucher.isActive ? 'active' : 'inactive'}
                    onChange={(e) => handleStatusChange(e.target.value === 'active')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Voucher Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin hệ thống</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">ID:</span>
                  <p className="font-medium">{voucher._id}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Ngày tạo:</span>
                  <p className="font-medium">{formatDate(voucher.createdAt)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Cập nhật lần cuối:</span>
                  <p className="font-medium">{formatDate(voucher.updatedAt)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Người tạo:</span>
                  <p className="font-medium">{voucher.createdBy?.name || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác</h3>
              <div className="space-y-3">
                <Link 
                  to={`/admin/vouchers/update/${voucher._id}`}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-center block"
                >
                  Chỉnh sửa voucher
                </Link>
                <button 
                  onClick={handleDeleteVoucher}
                  className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Xóa voucher
                </button>
                <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Sao chép voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewVouchersPage;
