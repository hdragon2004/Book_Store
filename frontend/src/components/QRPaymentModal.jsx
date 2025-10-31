import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { orderAPI } from '../services/apiService';

const QRPaymentModal = ({ isOpen, onClose, orderData, paymentMethod, onPaymentSuccess, onPaymentExpired }) => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 phút = 600 giây
  const [isExpired, setIsExpired] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [isAutoConfirming, setIsAutoConfirming] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const autoConfirmTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  
  // Danh sách các phương thức thanh toán QR (không bao gồm COD)
  const QR_PAYMENT_METHODS = ['momo', 'zalopay', 'bank_transfer'];
  const isQRPayment = QR_PAYMENT_METHODS.includes(paymentMethod);

  useEffect(() => {
    if (!isOpen) {
      // Cleanup khi modal đóng
      if (autoConfirmTimerRef.current) {
        clearTimeout(autoConfirmTimerRef.current);
        autoConfirmTimerRef.current = null;
      }
      return;
    }

    // Reset timer khi modal mở
    setTimeLeft(600);
    setIsExpired(false);
    setIsAutoConfirming(false);
    setIsPaymentConfirmed(false);

    // Tạo QR code
    generateQRCode();

    // fix: tự động xác nhận thanh toán QR sau 5 giây (mô phỏng)
    // Chỉ áp dụng cho QR payment methods (momo, zalopay, bank_transfer)
    if (isQRPayment && orderData?._id) {
      setIsAutoConfirming(true);
      setCountdown(5);
      
      // Đếm ngược từ 5 giây
      countdownTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Tự động xác nhận thanh toán sau 5 giây
      autoConfirmTimerRef.current = setTimeout(async () => {
        try {
          await orderAPI.mockAutoConfirmPayment(orderData._id, paymentMethod);
          setIsPaymentConfirmed(true);
          setIsAutoConfirming(false);
          
          // Tự động gọi callback thành công sau 1 giây để hiển thị thông báo
          setTimeout(() => {
            onPaymentSuccess?.();
          }, 1000);
        } catch (error) {
          console.error('Error auto-confirming payment:', error);
          setIsAutoConfirming(false);
          // Nếu lỗi, vẫn cho phép user click nút "Đã thanh toán" thủ công
        }
      }, 5000); // 5 giây
    }

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

    return () => {
      clearInterval(timer);
      if (autoConfirmTimerRef.current) {
        clearTimeout(autoConfirmTimerRef.current);
        autoConfirmTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [isOpen, onPaymentExpired, orderData, paymentMethod, isQRPayment]);

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

  const getPaymentTitle = () => {
    switch (paymentMethod) {
      case 'momo':
        return 'Thanh toán qua MoMo';
      case 'zalopay':
        return 'Thanh toán qua ZaloPay';
      case 'bank_transfer':
        return 'Chuyển khoản ngân hàng';
      default:
        return 'Thanh toán';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{getPaymentTitle()}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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

        {/* QR Code - Chỉ hiển thị khi chưa expired và chưa confirm */}
        {!isExpired && !isPaymentConfirmed && (
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
        )}

        {/* Payment Status - Chỉ hiển thị 2 trạng thái này cho QR payment */}
        {isQRPayment && (
          <div className="mb-4">
            {isAutoConfirming && !isPaymentConfirmed && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <p className="text-sm text-blue-700 flex items-center justify-center">
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Đang xử lý thanh toán tự động... (còn {countdown} giây)
                </p>
              </div>
            )}
            {isPaymentConfirmed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p className="text-sm text-green-700 font-semibold flex items-center justify-center">
                  <span className="inline-block mr-2">✅</span>
                  Thanh toán thành công! Đơn hàng đã được xác nhận.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Button - Chỉ hiển thị nút Hủy khi cần */}
        {!isPaymentConfirmed && (
          <button
            onClick={onClose}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isAutoConfirming}
          >
            Hủy
          </button>
        )}
      </div>
    </div>
  );
};

export default QRPaymentModal;
