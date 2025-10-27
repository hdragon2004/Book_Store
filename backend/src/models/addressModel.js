import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  name: {
    type: String,
    required: [true, 'Receiver name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Remove all non-digit characters for validation
        const cleanPhone = v.replace(/[^\d]/g, '');
        // Vietnamese phone numbers: 10-11 digits, starting with 0 or +84
        return /^(0[3|5|7|8|9])[0-9]{8}$/.test(cleanPhone) || 
               /^(\+84[3|5|7|8|9])[0-9]{8}$/.test(cleanPhone) ||
               /^84[3|5|7|8|9][0-9]{8}$/.test(cleanPhone);
      },
      message: 'Please enter a valid Vietnamese phone number (10-11 digits starting with 0 or +84)'
    }
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City name cannot exceed 50 characters']
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
    maxlength: [50, 'District name cannot exceed 50 characters']
  },
  ward: {
    type: String,
    required: [true, 'Ward is required'],
    trim: true,
    maxlength: [50, 'Ward name cannot exceed 50 characters']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Indexes for better performance
addressSchema.index({ userId: 1, isDeleted: 1 })
addressSchema.index({ userId: 1, isDefault: 1 })

// Ensure only one default address per user
addressSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    )
  }
  next()
})

// Static method to get user addresses
addressSchema.statics.getUserAddresses = function(userId) {
  return this.find({ userId, isDeleted: false }).sort({ isDefault: -1, createdAt: -1 })
}

// Static method to get default address
addressSchema.statics.getDefaultAddress = function(userId) {
  return this.findOne({ userId, isDefault: true, isDeleted: false })
}

// Static method to set default address
addressSchema.statics.setDefaultAddress = async function(userId, addressId) {
  // Remove default from all addresses
  await this.updateMany({ userId }, { isDefault: false })
  
  // Set new default
  return this.findByIdAndUpdate(
    addressId,
    { isDefault: true },
    { new: true }
  )
}

export default mongoose.model('Address', addressSchema)
