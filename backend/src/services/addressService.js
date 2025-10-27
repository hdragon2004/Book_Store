import Address from '~/models/addressModel'
import { AppError } from '~/utils/AppError'

/**
 * Address Service - Xử lý business logic cho địa chỉ giao hàng
 */

class AddressService {
  /**
   * Lấy danh sách địa chỉ của user
   */
  async getUserAddresses(userId) {
    try {
      const addresses = await Address.getUserAddresses(userId)
      return addresses
    } catch (error) {
      throw new AppError(`Failed to get user addresses: ${error.message}`, 500)
    }
  }

  /**
   * Lấy địa chỉ mặc định của user
   */
  async getDefaultAddress(userId) {
    try {
      const address = await Address.getDefaultAddress(userId)
      return address
    } catch (error) {
      throw new AppError(`Failed to get default address: ${error.message}`, 500)
    }
  }

  /**
   * Tạo địa chỉ mới
   */
  async createAddress(addressData) {
    try {
      const { userId, isDefault } = addressData

      // Nếu đây là địa chỉ đầu tiên hoặc được đặt làm mặc định
      if (isDefault) {
        // Bỏ mặc định của các địa chỉ khác
        await Address.updateMany(
          { userId, isDeleted: false },
          { isDefault: false }
        )
      } else {
        // Kiểm tra xem user có địa chỉ nào chưa
        const existingAddresses = await Address.countDocuments({ userId, isDeleted: false })
        if (existingAddresses === 0) {
          addressData.isDefault = true // Địa chỉ đầu tiên tự động làm mặc định
        }
      }

      const address = await Address.create(addressData)
      return address
    } catch (error) {
      throw new AppError(`Failed to create address: ${error.message}`, 500)
    }
  }

  /**
   * Cập nhật địa chỉ
   */
  async updateAddress(addressId, userId, updateData) {
    try {
      // Kiểm tra địa chỉ có thuộc về user không
      const existingAddress = await Address.findOne({ _id: addressId, userId, isDeleted: false })
      if (!existingAddress) {
        throw new AppError('Address not found or access denied', 404)
      }

      // Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ khác
      if (updateData.isDefault) {
        await Address.updateMany(
          { userId, _id: { $ne: addressId }, isDeleted: false },
          { isDefault: false }
        )
      }

      const address = await Address.findByIdAndUpdate(
        addressId,
        updateData,
        { new: true, runValidators: true }
      )

      return address
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError(`Failed to update address: ${error.message}`, 500)
    }
  }

  /**
   * Xóa địa chỉ (soft delete)
   */
  async deleteAddress(addressId, userId) {
    try {
      // Kiểm tra địa chỉ có thuộc về user không
      const existingAddress = await Address.findOne({ _id: addressId, userId, isDeleted: false })
      if (!existingAddress) {
        throw new AppError('Address not found or access denied', 404)
      }

      // Nếu đây là địa chỉ mặc định, đặt địa chỉ khác làm mặc định
      if (existingAddress.isDefault) {
        const otherAddress = await Address.findOne({ userId, _id: { $ne: addressId }, isDeleted: false })
        if (otherAddress) {
          await Address.findByIdAndUpdate(otherAddress._id, { isDefault: true })
        }
      }

      // Soft delete
      await Address.findByIdAndUpdate(addressId, { isDeleted: true })

      return true
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError(`Failed to delete address: ${error.message}`, 500)
    }
  }

  /**
   * Đặt địa chỉ làm mặc định
   */
  async setDefaultAddress(addressId, userId) {
    try {
      // Kiểm tra địa chỉ có thuộc về user không
      const existingAddress = await Address.findOne({ _id: addressId, userId, isDeleted: false })
      if (!existingAddress) {
        throw new AppError('Address not found or access denied', 404)
      }

      const address = await Address.setDefaultAddress(userId, addressId)
      return address
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError(`Failed to set default address: ${error.message}`, 500)
    }
  }
}

export default new AddressService()
