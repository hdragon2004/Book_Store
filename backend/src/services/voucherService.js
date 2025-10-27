import Voucher from '~/models/voucherModel'
import VoucherUsage from '~/models/voucherUsageModel'
import { AppError } from '~/utils/AppError'

/**
 * Voucher Service - Xử lý business logic cho voucher và discount
 */

class VoucherService {
  /**
   * Tạo voucher mới
   */
  async createVoucher(voucherData) {
    try {
      // Kiểm tra code đã tồn tại chưa
      const existingVoucher = await Voucher.findByCode(voucherData.code)
      if (existingVoucher) {
        throw new AppError('Voucher code already exists', 400)
      }

      // Validate voucher data
      this.validateVoucherData(voucherData)

      const voucher = await Voucher.create(voucherData)
      return voucher
    } catch (error) {
      throw new AppError(`Failed to create voucher: ${error.message}`, 500)
    }
  }

  /**
   * Lấy danh sách voucher
   */
  async getVouchers(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        type,
        isActive,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters

      // Build query
      const query = { isDeleted: false }
      
      if (search) {
        query.$or = [
          { code: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }
      
      if (type) query.type = type
      if (isActive !== undefined) query.isActive = isActive

      // Calculate pagination
      const skip = (page - 1) * limit

      // Execute query
      const vouchers = await Voucher.find(query)
        .populate('createdBy', 'name email')
        .populate('applicableCategories', 'name')
        .populate('applicableBooks', 'title')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)

      const total = await Voucher.countDocuments(query)

      return {
        vouchers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    } catch (error) {
      throw new AppError(`Failed to get vouchers: ${error.message}`, 500)
    }
  }

  /**
   * Lấy voucher theo ID
   */
  async getVoucherById(voucherId) {
    try {
      const voucher = await Voucher.findById(voucherId)
        .populate('createdBy', 'name email')
        .populate('applicableCategories', 'name')
        .populate('applicableBooks', 'title')

      if (!voucher) {
        throw new AppError('Voucher not found', 404)
      }

      return voucher
    } catch (error) {
      throw new AppError(`Failed to get voucher: ${error.message}`, 500)
    }
  }

  /**
   * Lấy voucher theo code
   */
  async getVoucherByCode(code) {
    try {
      const voucher = await Voucher.findByCode(code)
        .populate('applicableCategories', 'name')
        .populate('applicableBooks', 'title')

      if (!voucher) {
        throw new AppError('Voucher not found', 404)
      }

      return voucher
    } catch (error) {
      throw new AppError(`Failed to get voucher: ${error.message}`, 500)
    }
  }

  /**
   * Cập nhật voucher
   */
  async updateVoucher(voucherId, updateData) {
    try {
      const voucher = await Voucher.findById(voucherId)
      if (!voucher) {
        throw new AppError('Voucher not found', 404)
      }

      // Validate update data
      this.validateVoucherData(updateData, true)

      // Check if code is being changed and if it's unique
      if (updateData.code && updateData.code !== voucher.code) {
        const existingVoucher = await Voucher.findByCode(updateData.code)
        if (existingVoucher) {
          throw new AppError('Voucher code already exists', 400)
        }
      }

      const updatedVoucher = await Voucher.findByIdAndUpdate(
        voucherId,
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email')

      return updatedVoucher
    } catch (error) {
      throw new AppError(`Failed to update voucher: ${error.message}`, 500)
    }
  }

  /**
   * Xóa voucher (soft delete)
   */
  async deleteVoucher(voucherId) {
    try {
      const voucher = await Voucher.findById(voucherId)
      if (!voucher) {
        throw new AppError('Voucher not found', 404)
      }

      // Check if voucher has been used
      const usageCount = await VoucherUsage.countDocuments({ voucherId })
      if (usageCount > 0) {
        throw new AppError('Cannot delete voucher that has been used', 400)
      }

      voucher.isDeleted = true
      await voucher.save()

      return { message: 'Voucher deleted successfully' }
    } catch (error) {
      throw new AppError(`Failed to delete voucher: ${error.message}`, 500)
    }
  }

  /**
   * Kiểm tra và áp dụng voucher
   */
  async applyVoucher(voucherCode, orderData) {
    try {
      const { orderAmount, userId, categoryIds = [], bookIds = [] } = orderData

      // Lấy voucher
      const voucher = await this.getVoucherByCode(voucherCode)

      // Kiểm tra voucher có thể áp dụng không
      if (!voucher.isApplicableToOrder(orderAmount, userId, categoryIds, bookIds)) {
        throw new AppError('Voucher is not applicable to this order', 400)
      }

      // Kiểm tra user đã sử dụng voucher này chưa (nếu có giới hạn)
      if (voucher.usageLimit) {
        const hasUsed = await VoucherUsage.hasUserUsedVoucher(voucher._id, userId)
        if (hasUsed) {
          throw new AppError('You have already used this voucher', 400)
        }
      }

      // Tính toán discount amount
      const discountAmount = voucher.calculateDiscount(orderAmount)

      return {
        voucher,
        discountAmount,
        finalAmount: orderAmount - discountAmount
      }
    } catch (error) {
      throw new AppError(`Failed to apply voucher: ${error.message}`, 500)
    }
  }

  /**
   * Kiểm tra user đã sử dụng voucher chưa
   */
  async hasUserUsedVoucher(voucherId, userId) {
    try {
      const usage = await VoucherUsage.findOne({
        voucherId,
        userId,
        isRefunded: false
      })
      return !!usage
    } catch (error) {
      throw new AppError(`Failed to check voucher usage: ${error.message}`, 500)
    }
  }

  /**
   * Sử dụng voucher
   */
  async useVoucher(voucherId, userId, orderId, orderAmount, discountAmount) {
    try {
      const voucher = await Voucher.findById(voucherId)
      if (!voucher) {
        throw new AppError('Voucher not found', 404)
      }

      // Tạo voucher usage record
      const voucherUsage = await VoucherUsage.create({
        voucherId,
        userId,
        orderId,
        voucherCode: voucher.code,
        discountAmount,
        orderAmount
      })

      // Cập nhật used count
      voucher.usedCount += 1
      await voucher.save()

      return voucherUsage
    } catch (error) {
      throw new AppError(`Failed to use voucher: ${error.message}`, 500)
    }
  }

  /**
   * Hoàn trả voucher (khi hủy đơn hàng)
   */
  async refundVoucher(usageId, reason) {
    try {
      const voucherUsage = await VoucherUsage.findById(usageId)
      if (!voucherUsage) {
        throw new AppError('Voucher usage not found', 404)
      }

      if (voucherUsage.isRefunded) {
        throw new AppError('Voucher has already been refunded', 400)
      }

      // Cập nhật voucher usage
      voucherUsage.isRefunded = true
      voucherUsage.refundedAt = new Date()
      voucherUsage.refundReason = reason
      await voucherUsage.save()

      // Giảm used count của voucher
      const voucher = await Voucher.findById(voucherUsage.voucherId)
      if (voucher) {
        voucher.usedCount = Math.max(0, voucher.usedCount - 1)
        await voucher.save()
      }

      return voucherUsage
    } catch (error) {
      throw new AppError(`Failed to refund voucher: ${error.message}`, 500)
    }
  }

  /**
   * Lấy thống kê voucher
   */
  async getVoucherStats(voucherId) {
    try {
      const voucher = await this.getVoucherById(voucherId)
      const usageStats = await VoucherUsage.getUsageStats(voucherId)

      return {
        voucher,
        usageStats: usageStats[0] || {
          totalUsage: 0,
          totalDiscount: 0,
          totalOrderAmount: 0,
          refundedUsage: 0,
          refundedAmount: 0
        }
      }
    } catch (error) {
      throw new AppError(`Failed to get voucher stats: ${error.message}`, 500)
    }
  }

  /**
   * Validate voucher data
   */
  validateVoucherData(voucherData, isUpdate = false) {
    const { type, value, validFrom, validTo, usageLimit } = voucherData

    // Validate type and value
    if (type === 'percentage' && (value < 0 || value > 100)) {
      throw new AppError('Percentage value must be between 0 and 100', 400)
    }

    if (type === 'fixed_amount' && value < 0) {
      throw new AppError('Fixed amount value cannot be negative', 400)
    }

    // Validate dates
    if (validFrom && validTo && new Date(validFrom) >= new Date(validTo)) {
      throw new AppError('Valid from date must be before valid to date', 400)
    }

    // Validate usage limit
    if (usageLimit && usageLimit < 1) {
      throw new AppError('Usage limit must be at least 1', 400)
    }
  }
}

export default new VoucherService()
