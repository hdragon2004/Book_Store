import mongoose from 'mongoose'

const voucherUsageSchema = new mongoose.Schema({
  voucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher',
    required: [true, 'Voucher ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  voucherCode: {
    type: String,
    required: [true, 'Voucher code is required']
  },
  discountAmount: {
    type: Number,
    required: [true, 'Discount amount is required'],
    min: [0, 'Discount amount cannot be negative']
  },
  orderAmount: {
    type: Number,
    required: [true, 'Order amount is required'],
    min: [0, 'Order amount cannot be negative']
  },
  usedAt: {
    type: Date,
    default: Date.now
  },
  isRefunded: {
    type: Boolean,
    default: false
  },
  refundedAt: {
    type: Date,
    default: null
  },
  refundReason: {
    type: String,
    trim: true
  }
})

// Indexes for better performance
voucherUsageSchema.index({ voucherId: 1, userId: 1 })
voucherUsageSchema.index({ orderId: 1 })
voucherUsageSchema.index({ usedAt: -1 })
voucherUsageSchema.index({ isRefunded: 1 })

// Static method to check if user has used voucher
voucherUsageSchema.statics.hasUserUsedVoucher = function(voucherId, userId) {
  return this.findOne({
    voucherId,
    userId,
    isRefunded: false
  })
}

// Static method to get usage statistics
voucherUsageSchema.statics.getUsageStats = function(voucherId) {
  return this.aggregate([
    { $match: { voucherId: new mongoose.Types.ObjectId(voucherId) } },
    {
      $group: {
        _id: null,
        totalUsage: { $sum: 1 },
        totalDiscount: { $sum: '$discountAmount' },
        totalOrderAmount: { $sum: '$orderAmount' },
        refundedUsage: {
          $sum: { $cond: ['$isRefunded', 1, 0] }
        },
        refundedAmount: {
          $sum: { $cond: ['$isRefunded', '$discountAmount', 0] }
        }
      }
    }
  ])
}

export default mongoose.model('VoucherUsage', voucherUsageSchema)
