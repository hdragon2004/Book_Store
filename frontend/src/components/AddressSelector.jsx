import React, { useState, useEffect } from 'react'
import { addressService } from '../services/addressService'

const AddressSelector = ({ selectedAddressId, onAddressSelect, onAddNew }) => {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    isDefault: false
  })

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      setLoading(true)
      const response = await addressService.getUserAddresses()
      setAddresses(response.data.addresses)
    } catch (error) {
      alert('Không thể tải danh sách địa chỉ')
      console.error('Error fetching addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleAddAddress = async (e) => {
    e.preventDefault()
    
    try {
      const response = await addressService.createAddress(formData)
      alert('Thêm địa chỉ thành công')
      
      setShowAddForm(false)
      setFormData({
        name: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        ward: '',
        isDefault: false
      })
      
      // Refresh addresses list
      await fetchAddresses()
      
      // Auto-select the new address
      onAddressSelect(response.data.address._id)
      
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra')
      console.error('Error adding address:', error)
    }
  }

  const handleCancelAdd = () => {
    setShowAddForm(false)
    setFormData({
      name: '',
      phone: '',
      address: '',
      city: '',
      district: '',
      ward: '',
      isDefault: false
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Chọn địa chỉ giao hàng</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
        >
          <span>+</span>
          Thêm địa chỉ
        </button>
      </div>

      {/* Add Address Form */}
      {showAddForm && (
        <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
          <h4 className="text-md font-medium text-gray-900 mb-4">Thêm địa chỉ mới</h4>
          
          <form onSubmit={handleAddAddress} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Nhập họ và tên"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ chi tiết *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Nhập địa chỉ chi tiết"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tỉnh/Thành phố *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Nhập tỉnh/thành phố"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quận/Huyện *
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Nhập quận/huyện"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phường/Xã *
                </label>
                <input
                  type="text"
                  name="ward"
                  value={formData.ward}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Nhập phường/xã"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Đặt làm địa chỉ mặc định
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Thêm địa chỉ
              </button>
              <button
                type="button"
                onClick={handleCancelAdd}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address List */}
      <div className="space-y-3">
        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📍</div>
            <p className="text-gray-600 mb-4">Chưa có địa chỉ nào</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Thêm địa chỉ đầu tiên
            </button>
          </div>
        ) : (
          addresses.map((address) => (
            <div
              key={address._id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedAddressId === address._id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onAddressSelect(address._id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-500">👤</span>
                    <span className="font-medium text-gray-900 text-sm">{address.name}</span>
                    {address.isDefault && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                        Mặc định
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-500">📞</span>
                    <span className="text-gray-700 text-sm">{address.phone}</span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 mt-0.5">📍</span>
                    <div className="text-gray-700 text-sm">
                      <p>{address.address}</p>
                      <p>{address.ward}, {address.district}, {address.city}</p>
                    </div>
                  </div>
                </div>
                
                {selectedAddressId === address._id && (
                  <span className="text-blue-600 ml-2">✓</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AddressSelector
