import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderAPI } from '../../../services/apiService';

const AdminOrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const response = await orderAPI.getOrder(orderId);
        console.log('📦 Admin Order detail response:', response);
        setOrder(response?.data?.data || response?.data);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error fetching order detail:', error);
        setError('Không thể tải chi tiết đơn hàng');
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'confirmed': return 'Đã xác nhận';
      case 'shipped': return 'Đã giao';
      case 'delivered': return 'Đã nhận';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'cod': return 'Thanh toán khi nhận hàng';
      case 'credit_card': return 'Thẻ tín dụng';
      case 'bank_transfer': return 'Chuyển khoản ngân hàng';
      case 'paypal': return 'PayPal';
      default: return method;
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      await orderAPI.updateOrderStatus(orderId, newStatus);
      setOrder(prev => ({ ...prev, status: newStatus }));
      console.log('✅ Order status updated successfully');
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      alert('Lỗi khi cập nhật trạng thái đơn hàng');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải chi tiết đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-600 mb-8">{error || 'Đơn hàng không tồn tại'}</p>
          <div className="space-x-4">
            <Link 
              to="/admin/orders" 
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Chi tiết đơn hàng</h1>
            <p className="text-gray-600">
              Mã đơn hàng: <span className="font-medium text-blue-600">{order.orderCode || order._id}</span>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
            <Link 
              to="/admin/orders" 
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Quay lại
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Sản phẩm trong đơn hàng</h2>
              
              {order.orderItems && order.orderItems.length > 0 ? (
                <div className="space-y-4">
                  {order.orderItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      {/* Book Image */}
                      <div className="flex-shrink-0">
                        {item.bookId?.imageUrl ? (
                          <img 
                            src={item.bookId.imageUrl.startsWith('http') ? item.bookId.imageUrl : `http://localhost:5000${item.bookId.imageUrl}`}
                            alt={item.bookId?.title || 'Book'}
                            className="w-16 h-20 object-cover rounded"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'block';
                              }
                            }}
                          />
                        ) : null}
                        <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center" style={{display: item.bookId?.imageUrl ? 'none' : 'flex'}}>
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Book Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {item.bookId?.title || 'Sách không xác định'}
                        </h3>
                        <p className="text-sm text-gray-600">{item.bookId?.author || 'Tác giả không xác định'}</p>
                        <p className="text-sm text-gray-500">
                          Số lượng: {item.quantity} • Giá: {formatCurrency(item.priceAtPurchase)}
                        </p>
                        {item.bookId?.isbn && (
                          <p className="text-xs text-gray-400">ISBN: {item.bookId.isbn}</p>
                        )}
                      </div>
                      
                      {/* Total Price */}
                      <div className="text-right">
                        <p className="text-lg font-semibold text-blue-600">
                          {formatCurrency(item.priceAtPurchase * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Không có sản phẩm nào trong đơn hàng này</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Order Info & Actions */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Tên khách hàng:</span>
                  <p className="font-medium">{order.userId?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <p className="font-medium">{order.userId?.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Số điện thoại:</span>
                  <p className="font-medium">{order.userId?.phone || order.shippingAddress?.phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Địa chỉ:</span>
                  <p className="font-medium">{order.userId?.address || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Trạng thái tài khoản:</span>
                  <p className="font-medium">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      order.userId?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {order.userId?.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Địa chỉ giao hàng</h3>
                <div className="space-y-2">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p className="text-gray-600">{order.shippingAddress.phone}</p>
                  <p className="text-gray-600">{order.shippingAddress.address}</p>
                  <p className="text-gray-600">
                    {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}
                  </p>
                </div>
              </div>
            )}

            {/* Order Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin đơn hàng</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Mã đơn hàng:</span>
                  <p className="font-medium">{order.orderCode || order._id}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Ngày đặt:</span>
                  <p className="font-medium">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Cập nhật lần cuối:</span>
                  <p className="font-medium">
                    {order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Phương thức thanh toán:</span>
                  <p className="font-medium">{getPaymentMethodText(order.paymentMethod)}</p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">{formatCurrency(order.totalPrice)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span className="font-medium">-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-medium">Miễn phí</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Tổng cộng:</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {formatCurrency(order.totalPrice - (order.discountAmount || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Management */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quản lý trạng thái</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái hiện tại
                  </label>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cập nhật trạng thái
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updatingStatus}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="pending">Chờ xử lý</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="shipped">Đã giao</option>
                    <option value="delivered">Đã nhận</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
                {updatingStatus && (
                  <p className="text-sm text-blue-600">Đang cập nhật...</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Gửi email thông báo
                </button>
                <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                  In hóa đơn
                </button>
                <button className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                  Xuất Excel
                </button>
                {order.status === 'pending' && (
                  <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors">
                    Hủy đơn hàng
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;
