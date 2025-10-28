import mongoose from 'mongoose'

const shippingProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Shipping provider name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Shipping provider code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Code cannot exceed 10 characters']
  },
  baseFee: {
    type: Number,
    required: [true, 'Base fee is required'],
    min: [0, 'Base fee cannot be negative']
  },
  estimatedTime: {
    type: String,
    required: [true, 'Estimated time is required'],
    trim: true,
    maxlength: [50, 'Estimated time cannot exceed 50 characters']
  },
  active: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    website: {
      type: String,
      trim: true
    }
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
shippingProviderSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Indexes for better performance
shippingProviderSchema.index({ active: 1 })
shippingProviderSchema.index({ isDeleted: 1 })
shippingProviderSchema.index({ createdAt: -1 })

// Soft delete method
shippingProviderSchema.methods.softDelete = function() {
  this.isDeleted = true
  return this.save()
}

// Restore method
shippingProviderSchema.methods.restore = function() {
  this.isDeleted = false
  return this.save()
}

// Static method to find active providers
shippingProviderSchema.statics.findActive = function() {
  return this.find({ active: true, isDeleted: false })
}

// Static method to find deleted providers
shippingProviderSchema.statics.findDeleted = function() {
  return this.find({ isDeleted: true })
}

// Static method to get providers by code
shippingProviderSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase(), isDeleted: false })
}

// Static method to get default provider
shippingProviderSchema.statics.getDefaultProvider = function() {
  return this.findOne({ active: true, isDeleted: false }).sort({ createdAt: 1 })
}

export default mongoose.model('ShippingProvider', shippingProviderSchema)
