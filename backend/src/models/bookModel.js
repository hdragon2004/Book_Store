import mongoose from 'mongoose'

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    maxlength: [100, 'Author name cannot be more than 100 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  imageUrl: {
    type: String,
    default: ''
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true
  },
  publisher: {
    type: String,
    default: ''
  },
  publicationDate: {
    type: Date
  },
  pages: {
    type: Number,
    min: [0, 'Pages cannot be negative'],
    default: 0
  },
  format: {
    type: String,
    enum: ['hardcover', 'paperback', 'ebook', 'audiobook'],
    default: 'paperback'
  },
  dimensions: {
    type: String,
    default: ''
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative'],
    default: 0
  },
  fileUrl: {
    type: String,
    default: ''
  },
  // For digital books
  digitalFile: {
    filePath: {
      type: String,
      required: function() {
        return this.format === 'ebook' || this.format === 'audiobook'
      }
    },
    fileSize: {
      type: Number,
      required: function() {
        return this.format === 'ebook' || this.format === 'audiobook'
      }
    },
    mimeType: {
      type: String,
      required: function() {
        return this.format === 'ebook' || this.format === 'audiobook'
      }
    },
    duration: {
      type: Number, // in seconds for audiobooks
      required: function() {
        return this.format === 'audiobook'
      }
    }
  },
  viewCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['available', 'out_of_stock', 'discontinued', 'coming_soon'],
    default: 'available'
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
bookSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Index for search functionality
bookSchema.index({ title: 'text', author: 'text', description: 'text' })
bookSchema.index({ categoryId: 1 })
bookSchema.index({ isDeleted: 1 })
bookSchema.index({ isActive: 1 })
bookSchema.index({ status: 1 })
bookSchema.index({ createdAt: -1 })

// Method to check if book is digital
bookSchema.methods.isDigital = function() {
  return ['ebook', 'audiobook'].includes(this.format)
}

// Method to check if book is physical
bookSchema.methods.isPhysical = function() {
  return ['hardcover', 'paperback'].includes(this.format)
}

// Method to check if book is available
bookSchema.methods.isAvailable = function() {
  return this.status === 'available' && this.stock > 0
}

// Method to check if book is out of stock
bookSchema.methods.isOutOfStock = function() {
  return this.status === 'out_of_stock' || this.stock === 0
}

// Soft delete method
bookSchema.methods.softDelete = function() {
  this.isDeleted = true
  return this.save()
}

// Restore method
bookSchema.methods.restore = function() {
  this.isDeleted = false
  return this.save()
}

// Static method to find active books
bookSchema.statics.findActive = function() {
  return this.find({ isDeleted: false, isActive: true })
}

// Static method to find deleted books
bookSchema.statics.findDeleted = function() {
  return this.find({ isDeleted: true })
}

// Static method to get books by category
bookSchema.statics.findByCategory = function(categoryId) {
  return this.find({ categoryId, isDeleted: false, isActive: true })
}

// Static method to search books
bookSchema.statics.searchBooks = function(query) {
  return this.find({
    $text: { $search: query },
    isDeleted: false,
    isActive: true
  })
}

// Static method to find books by status
bookSchema.statics.findByStatus = function(status) {
  return this.find({ 
    status, 
    isDeleted: false, 
    isActive: true 
  })
}

// Static method to update book status
bookSchema.statics.updateStatus = function(bookId, status) {
  return this.findByIdAndUpdate(
    bookId, 
    { status, updatedAt: new Date() }, 
    { new: true }
  )
}

export default mongoose.model('Book', bookSchema)
