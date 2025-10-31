import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
  orderCode: {
    type: String,
    unique: true,
    required: [true, 'Order code is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  // Items will be in separate OrderItems collection
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  originalAmount: {
    type: Number,
    min: [0, 'Original amount cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  voucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher'
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'bank_transfer', 'momo', 'zalopay'],
    default: 'cod'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'digital_delivered'],
    default: 'pending'
  },
  shippingAddressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    required: [true, 'Shipping address is required']
  },
  shippingProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShippingProvider'
  },
  shippingFee: {
    type: Number,
    default: 0,
    min: [0, 'Shipping fee cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  // Timestamps for different statuses
  confirmedAt: {
    type: Date
  },
  shippedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  // Payment information (extend existing paymentMethod)
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String
  },
  qrCode: {
    type: String
  },
  paidAt: {
    type: Date
  }
})

// Auto generate order code before validation
orderSchema.pre('validate', async function(next) {
  // Only generate order code if it's a new document and orderCode is not set
  if (this.isNew && !this.orderCode) {
    let orderCode
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      // Generate order code: ORD-YYYYMMDD-RANDOM4
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const random4 = Math.floor(Math.random() * 9000) + 1000 // 1000-9999
      
      orderCode = `ORD-${year}${month}${day}-${random4}`
      
      // Check if order code already exists
      const existingOrder = await this.constructor.findOne({ orderCode })
      if (!existingOrder) {
        isUnique = true
      }
      
      attempts++
    }

    // If still not unique after max attempts, add timestamp milliseconds
    if (!isUnique) {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const timestamp = now.getTime().toString().slice(-4) // Last 4 digits of timestamp
      orderCode = `ORD-${year}${month}${day}-${timestamp}`
    }

    this.orderCode = orderCode
  }
  
  next()
})

// Auto update updatedAt
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Indexes for better performance
orderSchema.index({ userId: 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ isDeleted: 1 })
orderSchema.index({ createdAt: -1 })
orderSchema.index({ paymentMethod: 1 })

// Soft delete method
orderSchema.methods.softDelete = function() {
  this.isDeleted = true
  return this.save()
}

// Restore method
orderSchema.methods.restore = function() {
  this.isDeleted = false
  return this.save()
}

// Static method to find active orders
orderSchema.statics.findActive = function() {
  return this.find({ isDeleted: false })
}

// Static method to find deleted orders
orderSchema.statics.findDeleted = function() {
  return this.find({ isDeleted: true })
}

// Static method to get orders by user
orderSchema.statics.findByUser = function(userId) {
  return this.find({ userId, isDeleted: false })
}

// Static method to get orders by status
orderSchema.statics.findByStatus = function(status) {
  return this.find({ status, isDeleted: false })
}

// Static method to find order by order code
orderSchema.statics.findByOrderCode = function(orderCode) {
  return this.findOne({ orderCode, isDeleted: false })
}

// Static method to get order statistics
orderSchema.statics.getOrderStats = function() {
  return this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalPrice' }
      }
    }
  ])
}

export default mongoose.model('Order', orderSchema)