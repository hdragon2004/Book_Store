import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  priceAtPurchase: {
    type: Number,
    required: [true, 'Price at purchase is required'],
    min: [0, 'Price cannot be negative']
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
  }
})

// Auto update updatedAt
orderItemSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Index for better query performance
orderItemSchema.index({ orderId: 1 })
orderItemSchema.index({ bookId: 1 })
orderItemSchema.index({ isDeleted: 1 })
orderItemSchema.index({ createdAt: -1 })

// Soft delete method
orderItemSchema.methods.softDelete = function() {
  this.isDeleted = true
  return this.save()
}

// Restore method
orderItemSchema.methods.restore = function() {
  this.isDeleted = false
  return this.save()
}

// Static method to find active order items
orderItemSchema.statics.findActive = function() {
  return this.find({ isDeleted: false })
}

// Static method to find deleted order items
orderItemSchema.statics.findDeleted = function() {
  return this.find({ isDeleted: true })
}

// Static method to get order items by order
orderItemSchema.statics.findByOrder = function(orderId) {
  return this.find({ orderId, isDeleted: false })
}

// Static method to get order items by book
orderItemSchema.statics.findByBook = function(bookId) {
  return this.find({ bookId, isDeleted: false })
}

// Static method to calculate order total
orderItemSchema.statics.calculateOrderTotal = function(orderId) {
  return this.aggregate([
    { $match: { orderId, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalItems: { $sum: '$quantity' },
        totalPrice: { $sum: { $multiply: ['$quantity', '$priceAtPurchase'] } }
      }
    }
  ])
}

export default mongoose.model('OrderItem', orderItemSchema)
