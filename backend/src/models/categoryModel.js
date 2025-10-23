import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
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
categorySchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Index for search functionality
categorySchema.index({ name: 'text', description: 'text' })
categorySchema.index({ isDeleted: 1 })
categorySchema.index({ name: 1 }, { unique: true })
categorySchema.index({ createdAt: -1 })

// Soft delete method
categorySchema.methods.softDelete = function() {
  this.isDeleted = true
  return this.save()
}

// Restore method
categorySchema.methods.restore = function() {
  this.isDeleted = false
  return this.save()
}

// Static method to find active categories
categorySchema.statics.findActive = function() {
  return this.find({ isDeleted: false })
}

// Static method to find deleted categories
categorySchema.statics.findDeleted = function() {
  return this.find({ isDeleted: true })
}

// Static method to search categories
categorySchema.statics.searchCategories = function(query) {
  return this.find({
    $text: { $search: query },
    isDeleted: false
  })
}

export default mongoose.model('Category', categorySchema)