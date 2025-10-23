import mongoose from 'mongoose'

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  token: {
    type: String,
    required: [true, 'Reset token is required'],
    unique: true
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration time is required'],
    default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  isUsed: {
    type: Boolean,
    default: false
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
passwordResetSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Index for faster queries
passwordResetSchema.index({ email: 1, token: 1 })
passwordResetSchema.index({ expiresAt: 1 })
passwordResetSchema.index({ isDeleted: 1 })
passwordResetSchema.index({ createdAt: -1 })

// Static method to generate reset token
passwordResetSchema.statics.generateToken = function() {
  return require('crypto').randomBytes(32).toString('hex')
}

// Static method to verify token
passwordResetSchema.statics.verifyToken = async function(token) {
  const reset = await this.findOne({
    token,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  })

  if (!reset) {
    return { success: false, message: 'Invalid or expired reset token' }
  }

  if (reset.attempts >= 3) {
    return { success: false, message: 'Too many attempts. Please request a new reset link' }
  }

  return { success: true, message: 'Token is valid', email: reset.email }
}

// Static method to mark token as used
passwordResetSchema.statics.markAsUsed = async function(token) {
  await this.updateOne(
    { token },
    { isUsed: true }
  )
}

// Soft delete method
passwordResetSchema.methods.softDelete = function() {
  this.isDeleted = true
  return this.save()
}

// Restore method
passwordResetSchema.methods.restore = function() {
  this.isDeleted = false
  return this.save()
}

// Static method to find active resets
passwordResetSchema.statics.findActive = function() {
  return this.find({ isDeleted: false })
}

// Static method to find deleted resets
passwordResetSchema.statics.findDeleted = function() {
  return this.find({ isDeleted: true })
}

// Static method to soft delete expired tokens
passwordResetSchema.statics.cleanExpired = async function() {
  const expiredTokens = await this.find({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isUsed: true }
    ],
    isDeleted: false
  })
  
  // Soft delete expired tokens
  for (const token of expiredTokens) {
    await token.softDelete()
  }
  
  return expiredTokens.length
}

export default mongoose.model('PasswordReset', passwordResetSchema)
