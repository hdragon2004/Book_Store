import { StatusCodes } from 'http-status-codes'
import addressService from '~/services/addressService'
import { asyncHandler } from '~/utils/asyncHandler'
import { ApiResponse } from '~/utils/ApiResponse'

/**
 * Address Controller - Xử lý các request liên quan đến địa chỉ giao hàng
 */

class AddressController {
  /**
   * Lấy danh sách địa chỉ của user
   * GET /api/addresses
   */
  getUserAddresses = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const addresses = await addressService.getUserAddresses(userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, { addresses }, 'User addresses retrieved successfully')
    )
  })

  /**
   * Lấy địa chỉ mặc định của user
   * GET /api/addresses/default
   */
  getDefaultAddress = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const address = await addressService.getDefaultAddress(userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, { address }, 'Default address retrieved successfully')
    )
  })

  /**
   * Tạo địa chỉ mới
   * POST /api/addresses
   */
  createAddress = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const addressData = { ...req.body, userId }
    
    const address = await addressService.createAddress(addressData)

    res.status(StatusCodes.CREATED).json(
      new ApiResponse(StatusCodes.CREATED, { address }, 'Address created successfully')
    )
  })

  /**
   * Cập nhật địa chỉ
   * PUT /api/addresses/:id
   */
  updateAddress = asyncHandler(async (req, res) => {
    const { id } = req.params
    const userId = req.user._id
    const updateData = req.body

    const address = await addressService.updateAddress(id, userId, updateData)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, { address }, 'Address updated successfully')
    )
  })

  /**
   * Xóa địa chỉ (soft delete)
   * DELETE /api/addresses/:id
   */
  deleteAddress = asyncHandler(async (req, res) => {
    const { id } = req.params
    const userId = req.user._id

    await addressService.deleteAddress(id, userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, null, 'Address deleted successfully')
    )
  })

  /**
   * Đặt địa chỉ làm mặc định
   * PUT /api/addresses/:id/default
   */
  setDefaultAddress = asyncHandler(async (req, res) => {
    const { id } = req.params
    const userId = req.user._id

    const address = await addressService.setDefaultAddress(id, userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, { address }, 'Default address updated successfully')
    )
  })
}

export default new AddressController()
