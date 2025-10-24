import mongoose from 'mongoose'

const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Verification code is required'],
    length: 6
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration time is required'],
    default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
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
emailVerificationSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Index for faster queries
emailVerificationSchema.index({ email: 1, code: 1 })
emailVerificationSchema.index({ expiresAt: 1 })
emailVerificationSchema.index({ isDeleted: 1 })
emailVerificationSchema.index({ createdAt: -1 })

// Static method to generate verification code
emailVerificationSchema.statics.generateCode = function() {
  return Math.floor(100000 + Math.random() * 900000).toString() // 6-digit code
}

// Static method to verify code
emailVerificationSchema.statics.verifyCode = async function(email, code) {
  // Verifying code
  
  const verification = await this.findOne({
    email: email.toLowerCase(),
    code,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  })

  // Found verification
  if (verification) {
    // Verification details
  }

  if (!verification) {
    // Check if code exists but expired
    const expiredVerification = await this.findOne({
      email: email.toLowerCase(),
      code
    })
    if (expiredVerification) {
      // Found expired verification
    }
    return { success: false, message: 'Invalid or expired verification code' }
  }

  if (verification.attempts >= 3) {
    return { success: false, message: 'Too many attempts. Please request a new code' }
  }

  // Mark as used
  verification.isUsed = true
  await verification.save()

  return { success: true, message: 'Email verified successfully' }
}

// Soft delete method
emailVerificationSchema.methods.softDelete = function() {
  this.isDeleted = true
  return this.save()
}

// Restore method
emailVerificationSchema.methods.restore = function() {
  this.isDeleted = false
  return this.save()
}

// Static method to find active verifications
emailVerificationSchema.statics.findActive = function() {
  return this.find({ isDeleted: false })
}

// Static method to find deleted verifications
emailVerificationSchema.statics.findDeleted = function() {
  return this.find({ isDeleted: true })
}

// Static method to soft delete expired codes
emailVerificationSchema.statics.cleanExpired = async function() {
  const expiredCodes = await this.find({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isUsed: true }
    ],
    isDeleted: false
  })
  
  // Soft delete expired codes
  for (const code of expiredCodes) {
    await code.softDelete()
  }
  
  return expiredCodes.length
}

export default mongoose.model('EmailVerification', emailVerificationSchema)
