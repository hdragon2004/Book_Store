import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const QRPaymentModal = ({ isOpen, onClose, orderData, paymentMethod, onPaymentSuccess, onPaymentExpired }) => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 phút = 600 giây
  const [isExpired, setIsExpired] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Reset timer khi modal mở
    setTimeLeft(600);
    setIsExpired(false);

    // Tạo QR code
    generateQRCode();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsExpired(true);
          onPaymentExpired?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onPaymentExpired, orderData, paymentMethod]);

  const generateQRCode = async () => {
    try {
      // Tạo nội dung QR code dựa trên phương thức thanh toán
      let qrContent = '';
      const orderCode = orderData?.orderCode || 'ORD-XXXX';
      const amount = orderData?.totalPrice || 0;

      switch (paymentMethod) {
        case 'momo':
          qrContent = `momo://transfer?amount=${amount}&note=Thanh toan don hang ${orderCode}`;
          break;
        case 'zalopay':
          qrContent = `zalopay://transfer?amount=${amount}&note=Thanh toan don hang ${orderCode}`;
          break;
        case 'bank_transfer':
          qrContent = `bank://transfer?amount=${amount}&note=Thanh toan don hang ${orderCode}`;
          break;
        default:
          qrContent = `payment://${orderCode}?amount=${amount}`;
      }

      // Tạo QR code
      const qrDataURL = await QRCode.toDataURL(qrContent, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeDataURL(qrDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Fallback to placeholder
      setQrCodeDataURL('https://via.placeholder.com/200x200/FF6B6B/FFFFFF?text=QR+Error');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPaymentInfo = () => {
    switch (paymentMethod) {
      case 'momo':
        return {
          title: 'Thanh toán qua MoMo',
          instructions: [
            '1. Mở ứng dụng MoMo',
            '2. Chọn "Quét mã QR"',
            '3. Quét mã QR bên dưới',
            '4. Xác nhận thanh toán'
          ]
        };
      case 'zalopay':
        return {
          title: 'Thanh toán qua ZaloPay',
          instructions: [
            '1. Mở ứng dụng ZaloPay',
            '2. Chọn "Quét mã"',
            '3. Quét mã QR bên dưới',
            '4. Xác nhận thanh toán'
          ]
        };
      case 'bank_transfer':
        return {
          title: 'Chuyển khoản ngân hàng',
          instructions: [
            '1. Mở ứng dụng ngân hàng',
            '2. Chọn "Chuyển khoản QR"',
            '3. Quét mã QR bên dưới',
            '4. Nhập số tiền và xác nhận'
          ]
        };
      default:
        return {
          title: 'Thanh toán',
          instructions: ['Vui lòng quét mã QR để thanh toán']
        };
    }
  };

  const paymentInfo = getPaymentInfo();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{paymentInfo.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Order Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Mã đơn hàng:</span>
            <span className="font-medium">{orderData?.orderCode || 'ORD-XXXX'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Số tiền:</span>
            <span className="font-semibold text-lg text-blue-600">
              {orderData?.totalPrice?.toLocaleString('vi-VN')} ₫
            </span>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center mb-4">
          <div className={`text-2xl font-bold ${isExpired ? 'text-red-500' : 'text-blue-600'}`}>
            {isExpired ? 'HẾT HẠN' : formatTime(timeLeft)}
          </div>
          <div className="text-sm text-gray-500">
            {isExpired ? 'QR code đã hết hạn' : 'Thời gian còn lại'}
          </div>
        </div>

        {/* QR Code */}
        {!isExpired ? (
          <div className="text-center mb-4">
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
              {qrCodeDataURL ? (
                <img
                  src={qrCodeDataURL}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center mb-4">
            <div className="inline-block p-8 bg-gray-100 border-2 border-gray-300 rounded-lg">
              <svg className="w-24 h-24 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 mt-2">QR Code đã hết hạn</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Hướng dẫn thanh toán:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {paymentInfo.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {!isExpired ? (
            <>
              <button
                onClick={() => {
                  // Simulate payment success
                  onPaymentSuccess?.();
                }}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Đã thanh toán
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Hủy
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              Đóng
            </button>
          )}
        </div>

        {/* Note */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Vui lòng thanh toán trong thời gian quy định để đơn hàng được xử lý.</p>
        </div>
      </div>
    </div>
  );
};

export default QRPaymentModal;
