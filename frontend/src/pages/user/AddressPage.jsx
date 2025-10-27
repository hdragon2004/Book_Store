import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { addressService } from '../../services/addressService'

const AddressPage = () => {
  const navigate = useNavigate()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingAddress) {
        await addressService.updateAddress(editingAddress._id, formData)
        alert('Cập nhật địa chỉ thành công')
      } else {
        await addressService.createAddress(formData)
        alert('Thêm địa chỉ thành công')
      }
      
      setShowForm(false)
      setEditingAddress(null)
      setFormData({
        name: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        ward: '',
        isDefault: false
      })
      fetchAddresses()
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra')
      console.error('Error saving address:', error)
    }
  }

  const handleEdit = (address) => {
    setEditingAddress(address)
    setFormData({
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      district: address.district,
      ward: address.ward,
      isDefault: address.isDefault
    })
    setShowForm(true)
  }

  const handleDelete = async (addressId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      try {
        await addressService.deleteAddress(addressId)
        alert('Xóa địa chỉ thành công')
        fetchAddresses()
      } catch (error) {
        alert(error.response?.data?.message || 'Có lỗi xảy ra')
        console.error('Error deleting address:', error)
      }
    }
  }

  const handleSetDefault = async (addressId) => {
    try {
      await addressService.setDefaultAddress(addressId)
      alert('Đặt địa chỉ mặc định thành công')
      fetchAddresses()
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra')
      console.error('Error setting default address:', error)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingAddress(null)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Địa chỉ giao hàng</h1>
              <p className="mt-2 text-gray-600">Quản lý các địa chỉ giao hàng của bạn</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <span>+</span>
              Thêm địa chỉ
            </button>
          </div>
        </div>

        {/* Address Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập họ và tên"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ chi tiết *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập địa chỉ chi tiết"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tỉnh/Thành phố *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập tỉnh/thành phố"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quận/Huyện *
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập quận/huyện"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phường/Xã *
                  </label>
                  <input
                    type="text"
                    name="ward"
                    value={formData.ward}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {editingAddress ? 'Cập nhật' : 'Thêm địa chỉ'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address List */}
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có địa chỉ nào</h3>
              <p className="text-gray-600 mb-4">Thêm địa chỉ đầu tiên để bắt đầu mua sắm</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Thêm địa chỉ
              </button>
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address._id}
                className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                  address.isDefault ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-500">👤</span>
                      <span className="font-semibold text-gray-900">{address.name}</span>
                      {address.isDefault && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Mặc định
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-500">📞</span>
                      <span className="text-gray-700">{address.phone}</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 mt-0.5">📍</span>
                      <div className="text-gray-700">
                        <p>{address.address}</p>
                        <p>{address.ward}, {address.district}, {address.city}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address._id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Đặt làm mặc định"
                      >
                        ✓
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    
                    <button
                      onClick={() => handleDelete(address._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default AddressPage
