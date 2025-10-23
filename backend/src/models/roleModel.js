import mongoose from 'mongoose'

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Role name cannot be more than 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
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
roleSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Index for better performance
roleSchema.index({ isDeleted: 1 })
roleSchema.index({ createdAt: -1 })

// Soft delete method
roleSchema.methods.softDelete = function() {
  this.isDeleted = true
  return this.save()
}

// Restore method
roleSchema.methods.restore = function() {
  this.isDeleted = false
  return this.save()
}

// Static method to find active roles
roleSchema.statics.findActive = function() {
  return this.find({ isDeleted: false })
}

// Static method to find deleted roles
roleSchema.statics.findDeleted = function() {
  return this.find({ isDeleted: true })
}

// Static method to search roles
roleSchema.statics.searchRoles = function(query) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ],
    isDeleted: false
  })
}

export default mongoose.model('Role', roleSchema)
