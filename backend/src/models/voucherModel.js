import mongoose from 'mongoose'

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Voucher code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Voucher code cannot be more than 20 characters']
  },
  name: {
    type: String,
    required: [true, 'Voucher name is required'],
    trim: true,
    maxlength: [100, 'Voucher name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_shipping'],
    required: [true, 'Voucher type is required']
  },
  value: {
    type: Number,
    required: [true, 'Voucher value is required'],
    min: [0, 'Voucher value cannot be negative']
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order amount cannot be negative']
  },
  maxDiscountAmount: {
    type: Number,
    default: null,
    min: [0, 'Maximum discount amount cannot be negative']
  },
  usageLimit: {
    type: Number,
    default: null,
    min: [1, 'Usage limit must be at least 1']
  },
  usedCount: {
    type: Number,
    default: 0,
    min: [0, 'Used count cannot be negative']
  },
  validFrom: {
    type: Date,
    required: [true, 'Valid from date is required']
  },
  validTo: {
    type: Date,
    required: [true, 'Valid to date is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  applicableBooks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }],
  applicableUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
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
voucherSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Indexes for better performance
voucherSchema.index({ isActive: 1, validFrom: 1, validTo: 1 })
voucherSchema.index({ type: 1 })
voucherSchema.index({ createdAt: -1 })

// Virtual for remaining usage
voucherSchema.virtual('remainingUsage').get(function() {
  if (!this.usageLimit) return null
  return Math.max(0, this.usageLimit - this.usedCount)
})

// Virtual for isExpired
voucherSchema.virtual('isExpired').get(function() {
  return new Date() > this.validTo
})

// Virtual for isValid
voucherSchema.virtual('isValid').get(function() {
  const now = new Date()
  return this.isActive && 
         !this.isDeleted && 
         now >= this.validFrom && 
         now <= this.validTo &&
         (!this.usageLimit || this.usedCount < this.usageLimit)
})

// Method to check if voucher is applicable to order
voucherSchema.methods.isApplicableToOrder = function(orderAmount, userId, categoryIds = [], bookIds = []) {
  // Check if voucher is valid
  if (!this.isValid) return false

  // Check minimum order amount
  if (orderAmount < this.minOrderAmount) return false

  // Check if user is applicable
  if (this.applicableUsers.length > 0 && !this.applicableUsers.includes(userId)) {
    return false
  }

  // Check if categories are applicable
  if (this.applicableCategories.length > 0) {
    const hasApplicableCategory = categoryIds.some(catId => 
      this.applicableCategories.includes(catId)
    )
    if (!hasApplicableCategory) return false
  }

  // Check if books are applicable
  if (this.applicableBooks.length > 0) {
    const hasApplicableBook = bookIds.some(bookId => 
      this.applicableBooks.includes(bookId)
    )
    if (!hasApplicableBook) return false
  }

  return true
}

// Method to calculate discount amount
voucherSchema.methods.calculateDiscount = function(orderAmount) {
  let discountAmount = 0

  switch (this.type) {
    case 'percentage':
      discountAmount = (orderAmount * this.value) / 100
      break
    case 'fixed_amount':
      discountAmount = this.value
      break
    case 'free_shipping':
      discountAmount = 0 // Free shipping is handled separately
      break
  }

  // Apply maximum discount limit
  if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
    discountAmount = this.maxDiscountAmount
  }

  // Ensure discount doesn't exceed order amount
  return Math.min(discountAmount, orderAmount)
}

// Static method to find valid vouchers
voucherSchema.statics.findValidVouchers = function() {
  const now = new Date()
  return this.find({
    isActive: true,
    isDeleted: false,
    validFrom: { $lte: now },
    validTo: { $gte: now },
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
    ]
  })
}

// Static method to find voucher by code
voucherSchema.statics.findByCode = function(code) {
  return this.findOne({ 
    code: code.toUpperCase(), 
    isDeleted: false 
  })
}

export default mongoose.model('Voucher', voucherSchema)
