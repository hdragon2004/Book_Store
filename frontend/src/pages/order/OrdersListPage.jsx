import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderAPI } from '../../services/apiService';
import PageLayout from '../../layouts/PageLayout';

const OrdersListPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await orderAPI.getOrders({
          status: filterStatus !== 'all' ? filterStatus : undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
        console.log('📦 Orders response:', response);
        setOrders(response?.data?.data?.orders || response?.data?.orders || response?.data || []);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error fetching orders:', error);
        setError('Không thể tải danh sách đơn hàng');
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filterStatus]);

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

  const handleContactSupport = (order) => {
    // Tạo thông tin đơn hàng để gửi cho admin
    const orderInfo = {
      orderId: order._id,
      orderCode: order.orderCode || order._id,
      status: order.status,
      totalPrice: order.totalPrice,
      discountAmount: order.discountAmount || 0,
      finalPrice: order.totalPrice - (order.discountAmount || 0),
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      items: order.orderItems?.map(item => ({
        title: item.bookId?.title || 'Sách không xác định',
        author: item.bookId?.author || 'Tác giả không xác định',
        quantity: item.quantity,
        price: item.priceAtPurchase
      })) || [],
      shippingAddress: order.shippingAddress
    };

    // Lưu thông tin đơn hàng vào localStorage để chat có thể sử dụng
    localStorage.setItem('supportOrderInfo', JSON.stringify(orderInfo));
    
    // Chuyển đến trang chat
    navigate('/chat');
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách đơn hàng...</p>
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
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Lỗi tải dữ liệu</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Đơn hàng của tôi</h1>
          <p className="text-lg text-gray-600">
            {orders.length > 0 
              ? `Bạn có ${orders.length} đơn hàng`
              : 'Bạn chưa có đơn hàng nào'
            }
          </p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center space-x-4">
            <label className="text-lg font-semibold text-gray-900">Lọc theo trạng thái:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-amber-500 focus:border-amber-500 text-lg"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ xử lý</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="shipped">Đã giao</option>
              <option value="delivered">Đã nhận</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-8">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Chưa có đơn hàng</h2>
            <p className="text-xl text-gray-600 mb-8">Hãy mua sắm và tạo đơn hàng đầu tiên của bạn!</p>
            <Link 
              to="/books" 
              className="bg-amber-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Khám phá sách
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id || order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {/* Order Header */}
                <div className="p-8 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Đơn hàng #{order.orderCode || order._id}
                      </h3>
                      <p className="text-lg text-gray-600">
                        Đặt ngày: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <button
                        onClick={() => handleContactSupport(order)}
                        className="text-green-600 hover:text-green-800 font-medium text-sm"
                      >
                        💬 Hỗ trợ
                      </button>
                      <Link 
                        to={`/orders/${order._id || order.id}`}
                        className="text-amber-600 hover:text-amber-800 font-medium"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="px-8 py-4 bg-gray-50 rounded-b-2xl">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span>Phương thức thanh toán: </span>
                      <span className="font-medium">{getPaymentMethodText(order.paymentMethod)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-600">Tổng cộng: </span>
                      <span className="text-lg font-semibold text-amber-600">
                        {formatCurrency(order.totalPrice - (order.discountAmount || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default OrdersListPage;
