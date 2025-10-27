import { StatusCodes } from 'http-status-codes'
import voucherService from '~/services/voucherService'
import { asyncHandler } from '~/utils/asyncHandler'
import { ApiResponse } from '~/utils/ApiResponse'

/**
 * Voucher Controller - Xử lý các request liên quan đến voucher
 */

class VoucherController {
  /**
   * Tạo voucher mới (Admin only)
   * POST /api/v1/vouchers
   */
  createVoucher = asyncHandler(async (req, res) => {
    const voucherData = {
      ...req.body,
      createdBy: req.user._id
    }

    const voucher = await voucherService.createVoucher(voucherData)

    res.status(StatusCodes.CREATED).json(
      new ApiResponse(StatusCodes.CREATED, voucher, 'Voucher created successfully')
    )
  })

  /**
   * Lấy danh sách voucher
   * GET /api/v1/vouchers
   */
  getVouchers = asyncHandler(async (req, res) => {
    const result = await voucherService.getVouchers(req.query)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Vouchers retrieved successfully')
    )
  })

  /**
   * Lấy voucher theo ID
   * GET /api/v1/vouchers/:id
   */
  getVoucherById = asyncHandler(async (req, res) => {
    const { id } = req.params
    const voucher = await voucherService.getVoucherById(id)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, voucher, 'Voucher retrieved successfully')
    )
  })

  /**
   * Lấy voucher theo code
   * GET /api/v1/vouchers/code/:code
   */
  getVoucherByCode = asyncHandler(async (req, res) => {
    const { code } = req.params
    const voucher = await voucherService.getVoucherByCode(code)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, voucher, 'Voucher retrieved successfully')
    )
  })

  /**
   * Cập nhật voucher (Admin only)
   * PUT /api/v1/vouchers/:id
   */
  updateVoucher = asyncHandler(async (req, res) => {
    const { id } = req.params
    const updateData = req.body

    const voucher = await voucherService.updateVoucher(id, updateData)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, voucher, 'Voucher updated successfully')
    )
  })

  /**
   * Xóa voucher (Admin only)
   * DELETE /api/v1/vouchers/:id
   */
  deleteVoucher = asyncHandler(async (req, res) => {
    const { id } = req.params
    const result = await voucherService.deleteVoucher(id)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Voucher deleted successfully')
    )
  })

  /**
   * Kiểm tra voucher có thể áp dụng
   * POST /api/v1/vouchers/check
   */
  checkVoucher = asyncHandler(async (req, res) => {
    const { code, orderAmount, categoryIds, bookIds } = req.body
    const userId = req.user._id

    const result = await voucherService.applyVoucher(code, {
      orderAmount,
      userId,
      categoryIds,
      bookIds
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Voucher check completed')
    )
  })

  /**
   * Lấy thống kê voucher (Admin only)
   * GET /api/v1/vouchers/:id/stats
   */
  getVoucherStats = asyncHandler(async (req, res) => {
    const { id } = req.params
    const result = await voucherService.getVoucherStats(id)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Voucher statistics retrieved successfully')
    )
  })

  /**
   * Lấy danh sách voucher có thể áp dụng
   * GET /api/v1/vouchers/available
   */
  getAvailableVouchers = asyncHandler(async (req, res) => {
    const { orderAmount, categoryIds, bookIds } = req.query
    const userId = req.user._id

    // Lấy tất cả voucher hợp lệ
    const result = await voucherService.getVouchers({
      isActive: true,
      limit: 50
    })

    // Lọc voucher có thể áp dụng và kiểm tra đã sử dụng
    const availableVouchers = []
    const unavailableVouchers = []

    for (const voucher of result.vouchers) {
      try {
        const isApplicable = voucher.isApplicableToOrder(
          parseFloat(orderAmount) || 0,
          userId,
          categoryIds ? categoryIds.split(',') : [],
          bookIds ? bookIds.split(',') : []
        )

        // Kiểm tra user đã sử dụng voucher này chưa (nếu có giới hạn)
        let hasUsed = false
        if (voucher.usageLimit) {
          hasUsed = await voucherService.hasUserUsedVoucher(voucher._id, userId)
        }

        if (isApplicable && !hasUsed) {
          availableVouchers.push(voucher)
        } else {
          unavailableVouchers.push({
            ...voucher.toObject(),
            reason: !isApplicable ? 'not_applicable' : 'already_used'
          })
        }
      } catch (error) {
        unavailableVouchers.push({
          ...voucher.toObject(),
          reason: 'error'
        })
      }
    }

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, {
        availableVouchers,
        unavailableVouchers,
        total: availableVouchers.length
      }, 'Available vouchers retrieved successfully')
    )
  })
}

export default new VoucherController()
