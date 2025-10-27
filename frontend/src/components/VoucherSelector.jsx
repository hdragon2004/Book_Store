import React, { useState, useEffect } from 'react';
import { voucherAPI } from '../services/apiService';

const VoucherDropdown = ({ vouchers, selectedVoucherId, onVoucherSelect, loading }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedVoucher = vouchers.find(v => v._id === selectedVoucherId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
      >
        <div className="flex justify-between items-center">
          <span className={selectedVoucher ? 'text-gray-900' : 'text-gray-500'}>
            {loading ? 'Đang tải voucher...' : 
             selectedVoucher ? `${selectedVoucher.name} (${selectedVoucher.code})` : 
             'Chọn voucher'}
          </span>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <div className="p-2">
              <button
                type="button"
                onClick={() => {
                  onVoucherSelect(null);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-gray-500 hover:bg-gray-50 rounded"
              >
                Không chọn voucher
              </button>
            </div>
            {vouchers.map((voucher) => (
              <div key={voucher._id} className="p-2">
                <button
                  type="button"
                  onClick={() => {
                    onVoucherSelect(voucher);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-3 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">{voucher.name}</div>
                      <div className="text-sm text-gray-500 mb-1">Mã: {voucher.code}</div>
                      <div className="text-xs text-gray-400">
                        {voucher.type === 'percentage' ? `Giảm ${voucher.value}%` : `Giảm ${voucher.value.toLocaleString('vi-VN')} ₫`}
                        {voucher.minOrderAmount > 0 && (
                          <span className="block mt-1">
                            Áp dụng cho đơn hàng từ {voucher.minOrderAmount.toLocaleString('vi-VN')} ₫
                          </span>
                        )}
                        {voucher.maxDiscountAmount && voucher.type === 'percentage' && (
                          <span className="block mt-1">
                            Tối đa {voucher.maxDiscountAmount.toLocaleString('vi-VN')} ₫
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {voucher.type === 'percentage' ? `${voucher.value}%` : `${voucher.value.toLocaleString('vi-VN')} ₫`}
                      </div>
                      <div className="text-xs text-green-600 font-medium">✓ Có thể sử dụng</div>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const VoucherSelector = ({ 
  selectedItems, 
  selectedVoucherId, 
  onVoucherSelect, 
  appliedVoucher 
}) => {
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [unavailableVouchers, setUnavailableVouchers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load available vouchers khi selectedItems thay đổi
  useEffect(() => {
    const loadAvailableVouchers = async () => {
      if (selectedItems.length === 0) return;

      setLoading(true);
      try {
        const orderAmount = selectedItems.reduce((total, item) => total + (item.bookId.price * item.quantity), 0);
        const categoryIds = selectedItems.map(item => item.bookId.categoryId?._id).filter(Boolean);
        const bookIds = selectedItems.map(item => item.bookId._id);

        const response = await voucherAPI.getAvailableVouchers({
          orderAmount,
          categoryIds: categoryIds.join(','),
          bookIds: bookIds.join(',')
        });

        setAvailableVouchers(response.data.data.availableVouchers || []);
        setUnavailableVouchers(response.data.data.unavailableVouchers || []);
      } catch (error) {
        console.error('Error loading vouchers:', error);
        setAvailableVouchers([]);
        setUnavailableVouchers([]);
      } finally {
        setLoading(false);
      }
    };

    loadAvailableVouchers();
  }, [selectedItems]);

  const handleVoucherChange = (voucherId) => {
    if (voucherId) {
      const voucher = availableVouchers.find(v => v._id === voucherId);
      if (voucher) {
        const orderAmount = selectedItems.reduce((total, item) => total + (item.bookId.price * item.quantity), 0);
        const discount = voucher.type === 'percentage' ? 
          (orderAmount * voucher.value) / 100 : 
          voucher.value;
        
        onVoucherSelect({
          voucherId: voucher._id,
          code: voucher.code,
          name: voucher.name,
          discount: Math.min(discount, orderAmount)
        });
      }
    } else {
      onVoucherSelect(null);
    }
  };

  return (
    <div className="border-t pt-6">
      <h4 className="text-md font-semibold text-gray-900 mb-3">Mã giảm giá</h4>
      
      {/* Voucher Dropdown */}
      <div className="space-y-3">
        <VoucherDropdown
          vouchers={availableVouchers}
          selectedVoucherId={selectedVoucherId}
          onVoucherSelect={(voucher) => {
            if (voucher) {
              handleVoucherChange(voucher._id);
            } else {
              handleVoucherChange('');
            }
          }}
          loading={loading}
        />

        {/* Show message if no vouchers available */}
        {!loading && availableVouchers.length === 0 && (
          <div className="text-center py-4">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              {unavailableVouchers.length === 0 ? 
                'Không có voucher nào khả dụng' : 
                'Không có voucher nào phù hợp với đơn hàng này'
              }
            </p>
            {unavailableVouchers.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Có {unavailableVouchers.length} voucher không đủ điều kiện hoặc đã sử dụng
              </p>
            )}
          </div>
        )}
      </div>

      {/* Applied Voucher Display */}
      {appliedVoucher && (
        <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-800 font-medium">{appliedVoucher.name}</span>
              </div>
              <div className="text-green-600 text-sm">Mã: {appliedVoucher.code}</div>
            </div>
            <div className="text-right">
              <div className="text-green-800 font-bold text-lg">-{appliedVoucher.discount.toLocaleString('vi-VN')} ₫</div>
              <div className="text-green-600 text-xs">Đã áp dụng</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherSelector;
