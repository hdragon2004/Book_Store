import React from 'react';

const OrderInfoCard = ({ orderInfo }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'confirmed': return 'Đã xác nhận';
      case 'shipped': return 'Đã giao';
      case 'delivered': return 'Đã nhận';
      case 'cancelled': return 'Đã hủy';
      case 'digital_delivered': return 'Đã giao (Sách điện tử)';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'digital_delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
      <div className="flex items-center mb-3">
        <div className="text-2xl mr-2">📦</div>
        <h3 className="text-lg font-semibold text-gray-900">Thông tin đơn hàng</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Mã đơn hàng:</span>
          <span className="font-medium text-blue-600">{orderInfo.orderCode}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Trạng thái:</span>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(orderInfo.status)}`}>
            {getStatusText(orderInfo.status)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Tổng tiền:</span>
          <span className="font-semibold text-green-600">{formatCurrency(orderInfo.finalPrice)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Thanh toán:</span>
          <span className="font-medium">{getPaymentMethodText(orderInfo.paymentMethod)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Ngày đặt:</span>
          <span className="font-medium">{new Date(orderInfo.createdAt).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>
      
      {orderInfo.items && orderInfo.items.length > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Sản phẩm:</h4>
          <div className="space-y-1">
            {orderInfo.items.slice(0, 3).map((item, index) => (
              <div key={index} className="text-xs text-gray-600">
                • {item.title} - SL: {item.quantity} - {formatCurrency(item.price)}
              </div>
            ))}
            {orderInfo.items.length > 3 && (
              <div className="text-xs text-gray-500">
                ... và {orderInfo.items.length - 3} sản phẩm khác
              </div>
            )}
          </div>
        </div>
      )}
      
      {orderInfo.shippingAddress && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng:</h4>
          <div className="text-xs text-gray-600">
            <div>{orderInfo.shippingAddress.name} - {orderInfo.shippingAddress.phone}</div>
            <div>{orderInfo.shippingAddress.address}</div>
            <div>{orderInfo.shippingAddress.ward}, {orderInfo.shippingAddress.district}, {orderInfo.shippingAddress.city}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderInfoCard;
