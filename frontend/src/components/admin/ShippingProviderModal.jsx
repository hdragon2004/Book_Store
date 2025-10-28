import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '../icons/Icons'

const ShippingProviderModal = ({ provider, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    baseFee: '',
    estimatedTime: '',
    description: '',
    active: true,
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    }
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name || '',
        code: provider.code || '',
        baseFee: provider.baseFee || '',
        estimatedTime: provider.estimatedTime || '',
        description: provider.description || '',
        active: provider.active !== undefined ? provider.active : true,
        contactInfo: {
          phone: provider.contactInfo?.phone || '',
          email: provider.contactInfo?.email || '',
          website: provider.contactInfo?.website || ''
        }
      })
    }
  }, [provider])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name.startsWith('contactInfo.')) {
      const field = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Tên đơn vị vận chuyển là bắt buộc'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Mã đơn vị vận chuyển là bắt buộc'
    } else if (formData.code.length > 10) {
      newErrors.code = 'Mã không được vượt quá 10 ký tự'
    }

    if (!formData.baseFee || formData.baseFee <= 0) {
      newErrors.baseFee = 'Phí cơ bản phải lớn hơn 0'
    }

    if (!formData.estimatedTime.trim()) {
      newErrors.estimatedTime = 'Thời gian giao dự kiến là bắt buộc'
    }

    if (formData.contactInfo.email && !/\S+@\S+\.\S+/.test(formData.contactInfo.email)) {
      newErrors['contactInfo.email'] = 'Email không hợp lệ'
    }

    if (formData.contactInfo.website && !/^https?:\/\/.+/.test(formData.contactInfo.website)) {
      newErrors['contactInfo.website'] = 'Website phải bắt đầu bằng http:// hoặc https://'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const dataToSave = {
        ...formData,
        baseFee: parseFloat(formData.baseFee),
        code: formData.code.toUpperCase().trim()
      }

      if (provider) {
        await onSave(provider._id, dataToSave)
      } else {
        await onSave(dataToSave)
      }
    } catch (error) {
      console.error('Error saving provider:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {provider ? 'Chỉnh sửa đơn vị vận chuyển' : 'Thêm đơn vị vận chuyển mới'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên đơn vị vận chuyển *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ví dụ: Giao Hàng Nhanh"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã đơn vị vận chuyển *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ví dụ: GHN"
                maxLength="10"
              />
              {errors.code && (
                <p className="text-red-500 text-xs mt-1">{errors.code}</p>
              )}
            </div>
          </div>

          {/* Fee and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Base Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phí cơ bản (VND) *
              </label>
              <input
                type="number"
                name="baseFee"
                value={formData.baseFee}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.baseFee ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="25000"
                min="0"
                step="1000"
              />
              {errors.baseFee && (
                <p className="text-red-500 text-xs mt-1">{errors.baseFee}</p>
              )}
            </div>

            {/* Estimated Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian giao dự kiến *
              </label>
              <input
                type="text"
                name="estimatedTime"
                value={formData.estimatedTime}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.estimatedTime ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ví dụ: 2-3 ngày"
              />
              {errors.estimatedTime && (
                <p className="text-red-500 text-xs mt-1">{errors.estimatedTime}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mô tả về dịch vụ vận chuyển..."
            />
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Thông tin liên hệ</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="contactInfo.phone"
                  value={formData.contactInfo.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1900 1234"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="contactInfo.email"
                  value={formData.contactInfo.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors['contactInfo.email'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="support@example.com"
                />
                {errors['contactInfo.email'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['contactInfo.email']}</p>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  name="contactInfo.website"
                  value={formData.contactInfo.website}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors['contactInfo.website'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com"
                />
                {errors['contactInfo.website'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['contactInfo.website']}</p>
                )}
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Đơn vị vận chuyển đang hoạt động
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang lưu...' : (provider ? 'Cập nhật' : 'Tạo mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ShippingProviderModal
