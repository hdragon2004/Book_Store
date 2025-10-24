import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  fullName: {
    type: String,
    required: false,
    trim: true,
    maxlength: [100, 'Full name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: [true, 'Role is required']
  },
  avatar: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Auto update updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Hash password if modified and not already hashed
  if (!this.isModified('password')) return next()
  
  // Check if password is already hashed (starts with $2b$)
  if (this.password.startsWith('$2b$')) {
    // Password already hashed, skipping
    return next()
  }
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Soft delete method
userSchema.methods.softDelete = function() {
  this.isDeleted = true
  return this.save()
}

// Restore method
userSchema.methods.restore = function() {
  this.isDeleted = false
  return this.save()
}

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isDeleted: false })
}

// Static method to find deleted users
userSchema.statics.findDeleted = function() {
  return this.find({ isDeleted: true })
}

// Indexes for better performance
userSchema.index({ roleId: 1 })
userSchema.index({ isDeleted: 1 })
userSchema.index({ createdAt: -1 })

export default mongoose.model('User', userSchema)
