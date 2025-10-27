import { addressAPI } from './apiService'

// Address Service - Wrapper cho Address API
export const addressService = {
  // Get user addresses
  getUserAddresses: async () => {
    try {
      const response = await addressAPI.getUserAddresses()
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get default address
  getDefaultAddress: async () => {
    try {
      const response = await addressAPI.getDefaultAddress()
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Create address
  createAddress: async (addressData) => {
    try {
      const response = await addressAPI.createAddress(addressData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Update address
  updateAddress: async (id, addressData) => {
    try {
      const response = await addressAPI.updateAddress(id, addressData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Delete address
  deleteAddress: async (id) => {
    try {
      const response = await addressAPI.deleteAddress(id)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Set default address
  setDefaultAddress: async (id) => {
    try {
      const response = await addressAPI.setDefaultAddress(id)
      return response.data
    } catch (error) {
      throw error
    }
  }
}

export default addressService
