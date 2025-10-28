import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { orderAPI } from '../../services/apiService';
import PageLayout from '../../layouts/PageLayout';
import QRPaymentModal from '../../components/QRPaymentModal';
import AddressSelector from '../../components/AddressSelector';
import VoucherSelector from '../../components/VoucherSelector';
import ShippingProviderSelector from '../../components/ShippingProviderSelector';

const OrderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [selectedVoucherId, setSelectedVoucherId] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedShippingProvider, setSelectedShippingProvider] = useState(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  // Lấy dữ liệu từ CartPage
  useEffect(() => {
    if (location.state) {
      setSelectedItems(location.state.selectedItems || []);
    } else {
      // Nếu không có dữ liệu, chuyển về giỏ hàng
      navigate('/cart');
    }
  }, [location.state, navigate]);

  // Tính tổng tiền
  const calculateSubtotal = () => {
    return selectedItems.reduce((total, item) => total + (item.bookId.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    return appliedVoucher ? appliedVoucher.discount : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + shippingFee;
  };

  // Xử lý chọn voucher
  const handleVoucherSelect = (voucher) => {
    if (voucher) {
      setSelectedVoucherId(voucher.voucherId);
      setAppliedVoucher(voucher);
    } else {
      setSelectedVoucherId('');
      setAppliedVoucher(null);
    }
  };

  // Xử lý chọn đơn vị vận chuyển
  const handleShippingProviderSelect = (provider) => {
    console.log('🚚 Selected shipping provider:', provider);
    setSelectedShippingProvider(provider);
    setShippingFee(provider ? provider.baseFee : 0);
  };

  // Xử lý tạo đơn hàng
  const handleCreateOrder = async () => {
    // Kiểm tra địa chỉ giao hàng
    if (!selectedAddressId) {
      alert('Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    // Kiểm tra đơn vị vận chuyển
    if (!selectedShippingProvider) {
      alert('Vui lòng chọn đơn vị vận chuyển');
      return;
    }

    setLoading(true);
    try {
      console.log('📦 Creating order with data:', {
        shippingAddressId: selectedAddressId,
        shippingProviderId: selectedShippingProvider?._id,
        selectedShippingProvider: selectedShippingProvider
      });
      
      const orderData = {
        shippingAddressId: selectedAddressId,
        shippingProviderId: selectedShippingProvider._id,
        paymentMethod,
        voucherCode: appliedVoucher ? appliedVoucher.code : null,
        items: selectedItems.map(item => ({
          bookId: item.bookId._id,
          quantity: item.quantity
        }))
      };

      const response = await orderAPI.createOrder(orderData);
      console.log('Order creation response:', response);
      const order = response.data.data.order; // Sửa từ response.data.data thành response.data.data.order
      console.log('Order data:', order);
      console.log('Order ID:', order._id);
      
      // Kiểm tra order._id có tồn tại không
      if (!order || !order._id) {
        console.error('Order or order._id is missing:', order);
        alert('Có lỗi khi tạo đơn hàng. Vui lòng thử lại.');
        return;
      }
      
      // Nếu là COD, chuyển thẳng đến trang chi tiết đơn hàng
      if (paymentMethod === 'cod') {
        navigate(`/orders/${order._id}`, { 
          state: { 
            message: 'Đơn hàng đã được tạo thành công!',
            order: order
          }
        });
      } else {
        // Nếu không phải COD, hiển thị QR modal
        setCreatedOrder(order);
        setShowQRModal(true);
      }
      
    } catch (error) {
      console.error('Error creating order:', error);
      
      // Xử lý các loại lỗi khác nhau
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Dữ liệu không hợp lệ';
        alert(`Lỗi: ${errorMessage}`);
      } else if (error.response?.status === 409) {
        alert('Một số sách trong đơn hàng đã có trong thư viện của bạn. Đơn hàng vẫn được tạo nhưng chỉ những sách mới sẽ được thêm vào thư viện.');
      } else {
        alert('Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thanh toán thành công
  const handlePaymentSuccess = () => {
    setShowQRModal(false);
    navigate(`/orders/${createdOrder._id}`, { 
      state: { 
        message: 'Thanh toán thành công! Đơn hàng đã được xác nhận.',
        order: createdOrder
      }
    });
  };

  // Xử lý QR hết hạn
  const handlePaymentExpired = () => {
    setShowQRModal(false);
    alert('QR code đã hết hạn. Đơn hàng sẽ bị hủy. Vui lòng tạo đơn hàng mới.');
    // Có thể thêm logic hủy đơn hàng ở đây
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang xử lý đơn hàng...</p>
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
            <p className="text-gray-600 mb-4">{error}</p>
            <Link 
              to="/cart" 
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Quay lại giỏ hàng
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Xác nhận đơn hàng</h1>
          <p className="text-lg text-gray-600">
            Vui lòng kiểm tra lại thông tin đơn hàng và nhập địa chỉ giao hàng
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Selected Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
              <div className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sản phẩm đã chọn</h2>
                
                <div className="space-y-4">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl">
                      {/* Book Image */}
                      <div className="flex-shrink-0">
                        <img 
                          src={item.bookId.imageUrl.startsWith('http') ? item.bookId.imageUrl : `http://localhost:5000${item.bookId.imageUrl}`}
                          alt={item.bookId.title}
                          className="w-16 h-20 object-cover rounded-xl"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'block';
                            }
                          }}
                        />
                        <div className="w-16 h-20 bg-gray-200 rounded-xl flex items-center justify-center" style={{display: 'none'}}>
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Book Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {item.bookId.title}
                        </h3>
                        <p className="text-sm text-gray-600">{item.bookId.author}</p>
                        <p className="text-sm text-gray-500">
                          {item.bookId.format} • Số lượng: {item.quantity}
                        </p>
                        <p className="text-lg font-semibold text-black mt-2">
                          {(item.bookId.price * item.quantity).toLocaleString('vi-VN')} ₫
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Method & Voucher Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Phương thức thanh toán</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <label className="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Thanh toán khi nhận hàng</div>
                      <div className="text-sm text-gray-500">COD</div>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="momo"
                      checked={paymentMethod === 'momo'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Ví MoMo</div>
                      <div className="text-sm text-gray-500">QR Code</div>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="zalopay"
                      checked={paymentMethod === 'zalopay'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">ZaloPay</div>
                      <div className="text-sm text-gray-500">QR Code</div>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Chuyển khoản</div>
                      <div className="text-sm text-gray-500">QR Code</div>
                    </div>
                  </label>
                </div>

                {/* Voucher Section */}
                <VoucherSelector
                  selectedItems={selectedItems}
                  selectedVoucherId={selectedVoucherId}
                  onVoucherSelect={handleVoucherSelect}
                  appliedVoucher={appliedVoucher}
                />
              </div>
            </div>

            {/* Address Selection */}
            <AddressSelector
              selectedAddressId={selectedAddressId}
              onAddressSelect={setSelectedAddressId}
              onAddNew={() => {
                // Có thể mở modal hoặc chuyển đến trang quản lý địa chỉ
                window.open('/addresses', '_blank');
              }}
            />

            {/* Shipping Provider Selection */}
            <ShippingProviderSelector
              selectedProvider={selectedShippingProvider}
              onProviderSelect={handleShippingProviderSelect}
            />
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sticky top-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">{calculateSubtotal().toLocaleString('vi-VN')} ₫</span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá ({appliedVoucher.name}):</span>
                    <span className="font-medium">-{calculateDiscount().toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-medium">{shippingFee.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Tổng cộng:</span>
                    <span className="text-lg font-semibold text-amber-600">{calculateTotal().toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleCreateOrder}
                disabled={loading}
                className="w-full bg-amber-600 text-white py-4 rounded-xl font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {loading ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>
              
              <Link 
                to="/cart" 
                className="block w-full text-center text-amber-600 py-4 border border-amber-600 rounded-xl hover:bg-amber-50 transition-colors"
              >
                Quay lại giỏ hàng
              </Link>
            </div>
          </div>
        </div>

        {/* QR Payment Modal */}
        <QRPaymentModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          orderData={createdOrder}
          paymentMethod={paymentMethod}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentExpired={handlePaymentExpired}
        />
    </PageLayout>
  );
};

export default OrderPage;
