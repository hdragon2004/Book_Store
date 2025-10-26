import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { voucherAPI } from '../../../services/apiService';

const UpdateVouchersPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'percentage',
    value: '',
    validFrom: '',
    validTo: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    isActive: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        setInitialLoading(true);
        const response = await voucherAPI.getVoucher(id);
        console.log('🎫 UpdateVouchersPage - Fetched voucher:', response);
        
        const voucher = response?.data?.data || response?.data;
        
        if (voucher) {
          setFormData({
            code: voucher.code || '',
            name: voucher.name || '',
            type: voucher.type || 'percentage',
            value: voucher.value || '',
            validFrom: voucher.validFrom ? new Date(voucher.validFrom).toISOString().slice(0, 16) : '',
            validTo: voucher.validTo ? new Date(voucher.validTo).toISOString().slice(0, 16) : '',
            minOrderAmount: voucher.minOrderAmount || '',
            maxDiscountAmount: voucher.maxDiscountAmount || '',
            usageLimit: voucher.usageLimit || '',
            isActive: voucher.isActive !== false
          });
        } else {
          console.error('No voucher data found');
          alert('Không tìm thấy voucher');
          navigate('/admin/vouchers');
        }

        setInitialLoading(false);
      } catch (error) {
        console.error('Error fetching voucher:', error);
        alert('Lỗi khi tải thông tin voucher');
        navigate('/admin/vouchers');
        setInitialLoading(false);
      }
    };

    if (id) {
      fetchVoucher();
    }
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.code.trim()) {
      newErrors.code = 'Mã voucher là bắt buộc';
    } else if (formData.code.trim().length < 3) {
      newErrors.code = 'Mã voucher phải có ít nhất 3 ký tự';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tên voucher là bắt buộc';
    }
    
    if (!formData.value || formData.value <= 0) {
      newErrors.value = 'Giá trị voucher phải lớn hơn 0';
    } else if (formData.type === 'percentage' && formData.value > 100) {
      newErrors.value = 'Phần trăm không được vượt quá 100%';
    } else if (formData.type === 'percentage' && formData.value < 0) {
      newErrors.value = 'Phần trăm không được âm';
    } else if (formData.type === 'fixed_amount' && formData.value < 0) {
      newErrors.value = 'Số tiền không được âm';
    }
    
    if (!formData.validFrom) {
      newErrors.validFrom = 'Ngày bắt đầu là bắt buộc';
    }
    
    if (!formData.validTo) {
      newErrors.validTo = 'Ngày kết thúc là bắt buộc';
    } else if (formData.validFrom && formData.validTo && new Date(formData.validTo) <= new Date(formData.validFrom)) {
      newErrors.validTo = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    
    if (formData.minOrderAmount && formData.minOrderAmount < 0) {
      newErrors.minOrderAmount = 'Đơn hàng tối thiểu không được âm';
    }
    
    if (formData.maxDiscountAmount && formData.maxDiscountAmount < 0) {
      newErrors.maxDiscountAmount = 'Giảm giá tối đa không được âm';
    }
    
    if (formData.usageLimit && formData.usageLimit < 1) {
      newErrors.usageLimit = 'Giới hạn sử dụng phải lớn hơn 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        value: parseFloat(formData.value),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined
      };

      console.log('🎫 UpdateVouchersPage - Submitting data:', submitData);
      const response = await voucherAPI.updateVoucher(id, submitData);
      console.log('🎫 UpdateVouchersPage - Update response:', response);
      
      alert('Cập nhật voucher thành công!');
      navigate('/admin/vouchers');
    } catch (error) {
      console.error('Error updating voucher:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật voucher. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Cập nhật voucher</h1>
              <p className="text-gray-600">Chỉnh sửa thông tin voucher trong hệ thống</p>
            </div>
            <div className="text-sm text-gray-500">
              ID: {id}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Voucher Info */}
          {formData.code && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Thông tin voucher hiện tại:</h3>
              <div className="text-sm text-blue-700">
                <p><strong>Mã:</strong> {formData.code}</p>
                <p><strong>Tên:</strong> {formData.name}</p>
                <p><strong>Loại:</strong> {
                  formData.type === 'percentage' ? 'Phần trăm' :
                  formData.type === 'fixed_amount' ? 'Số tiền cố định' :
                  'Miễn phí vận chuyển'
                }</p>
                <p><strong>Giá trị:</strong> {
                  formData.type === 'percentage' ? `${formData.value}%` :
                  formData.type === 'free_shipping' ? 'Miễn phí vận chuyển' :
                  `${formData.value} VNĐ`
                }</p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã voucher <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nhập mã voucher (VD: WELCOME10)"
                style={{ textTransform: 'uppercase' }}
              />
              {errors.code && <p className="mt-1 text-sm text-red-500">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên voucher <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nhập tên voucher"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
          </div>

          {/* Type and Value */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại voucher <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed_amount">Số tiền cố định (VNĐ)</option>
                <option value="free_shipping">Miễn phí vận chuyển</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá trị <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.value ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={formData.type === 'percentage' ? '10' : '50000'}
                disabled={formData.type === 'free_shipping'}
              />
              {errors.value && <p className="mt-1 text-sm text-red-500">{errors.value}</p>}
              {formData.type === 'free_shipping' && (
                <p className="mt-1 text-sm text-gray-500">Tự động miễn phí vận chuyển</p>
              )}
            </div>
          </div>

          {/* Validity Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.validFrom ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.validFrom && <p className="mt-1 text-sm text-red-500">{errors.validFrom}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="validTo"
                value={formData.validTo}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.validTo ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.validTo && <p className="mt-1 text-sm text-red-500">{errors.validTo}</p>}
            </div>
          </div>

          {/* Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đơn hàng tối thiểu (VNĐ)
              </label>
              <input
                type="number"
                name="minOrderAmount"
                value={formData.minOrderAmount}
                onChange={handleInputChange}
                min="0"
                step="1000"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.minOrderAmount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="100000"
              />
              {errors.minOrderAmount && <p className="mt-1 text-sm text-red-500">{errors.minOrderAmount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giảm giá tối đa (VNĐ)
              </label>
              <input
                type="number"
                name="maxDiscountAmount"
                value={formData.maxDiscountAmount}
                onChange={handleInputChange}
                min="0"
                step="1000"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.maxDiscountAmount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="50000"
              />
              {errors.maxDiscountAmount && <p className="mt-1 text-sm text-red-500">{errors.maxDiscountAmount}</p>}
            </div>
          </div>

          {/* Usage Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giới hạn sử dụng
            </label>
            <input
              type="number"
              name="usageLimit"
              value={formData.usageLimit}
              onChange={handleInputChange}
              min="1"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.usageLimit ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="100 (để trống = không giới hạn)"
            />
            {errors.usageLimit && <p className="mt-1 text-sm text-red-500">{errors.usageLimit}</p>}
            <p className="mt-1 text-sm text-gray-500">
              Số lần tối đa voucher có thể được sử dụng
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Voucher đang hoạt động
            </label>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Xem trước voucher:</h3>
            <div className="bg-white p-3 rounded border">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-gray-900">{formData.code || 'MÃ_VOUCHER'}</h4>
                  <p className="text-sm text-gray-600">{formData.name || 'Tên voucher'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">
                    {formData.type === 'percentage' 
                      ? `${formData.value || 0}%` 
                      : formData.type === 'free_shipping'
                      ? 'Miễn phí vận chuyển'
                      : `${formData.value || 0} VNĐ`
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    {formData.validFrom && formData.validTo 
                      ? `${new Date(formData.validFrom).toLocaleDateString('vi-VN')} - ${new Date(formData.validTo).toLocaleDateString('vi-VN')}`
                      : 'Chưa chọn thời gian'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/vouchers')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateVouchersPage;
