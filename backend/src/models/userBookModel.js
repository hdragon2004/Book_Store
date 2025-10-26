import mongoose from 'mongoose'

const userBookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book ID is required']
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  bookType: {
    type: String,
    enum: ['physical', 'ebook', 'audiobook'],
    required: [true, 'Book type is required']
  },
  // For digital books
  filePath: {
    type: String,
    required: function() {
      return this.bookType === 'ebook' || this.bookType === 'audiobook'
    }
  },
  fileSize: {
    type: Number,
    required: function() {
      return this.bookType === 'ebook' || this.bookType === 'audiobook'
    }
  },
  mimeType: {
    type: String,
    required: function() {
      return this.bookType === 'ebook' || this.bookType === 'audiobook'
    }
  },
  // Download tracking
  downloadCount: {
    type: Number,
    default: 0,
    max: [3, 'Maximum 3 downloads allowed']
  },
  lastDownloadAt: {
    type: Date
  },
  // Download history (embedded documents)
  downloadHistory: [{
    downloadType: {
      type: String,
      enum: ['download', 'stream'],
      required: true
    },
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: String,
    fileSize: Number,
    downloadDuration: Number, // in seconds
    status: {
      type: String,
      enum: ['started', 'completed', 'failed'],
      default: 'started'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Access control
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    // Digital books don't expire, but we can set expiration for special cases
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Auto update updatedAt
userBookSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Indexes for better query performance
userBookSchema.index({ userId: 1, bookId: 1 }, { unique: true })
userBookSchema.index({ userId: 1, bookType: 1 })
userBookSchema.index({ orderId: 1 })
userBookSchema.index({ isActive: 1 })
userBookSchema.index({ expiresAt: 1 })

// Static methods
userBookSchema.statics.getUserBooks = async function(userId, bookType = null) {
  const query = { userId, isActive: true }
  if (bookType) {
    query.bookType = bookType
  }
  
  return await this.find(query)
    .populate({
      path: 'bookId',
      select: 'title author price imageUrl description categoryId',
      populate: {
        path: 'categoryId',
        select: 'name'
      }
    })
    .populate('orderId', 'orderCode status createdAt')
    .sort({ createdAt: -1 })
}

userBookSchema.statics.checkUserOwnsBook = async function(userId, bookId) {
  const userBook = await this.findOne({ 
    userId, 
    bookId, 
    isActive: true 
  })
  return !!userBook
}

userBookSchema.statics.incrementDownloadCount = async function(userId, bookId) {
  const userBook = await this.findOne({ userId, bookId, isActive: true })
  if (!userBook) {
    throw new Error('User does not own this book')
  }
  
  if (userBook.downloadCount >= 3) {
    throw new Error('Maximum download limit reached')
  }
  
  userBook.downloadCount += 1
  userBook.lastDownloadAt = new Date()
  await userBook.save()
  
  return userBook
}

// Add download history entry
userBookSchema.methods.addDownloadHistory = function(downloadData) {
  this.downloadHistory.push(downloadData)
  return this.save()
}

// Get download history
userBookSchema.methods.getDownloadHistory = function(limit = 50) {
  return this.downloadHistory
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
}

// Get download stats
userBookSchema.methods.getDownloadStats = function() {
  const totalDownloads = this.downloadHistory.length
  const completedDownloads = this.downloadHistory.filter(d => d.status === 'completed').length
  const lastDownload = this.downloadHistory.length > 0 
    ? this.downloadHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
    : null

  return {
    totalDownloads,
    completedDownloads,
    lastDownload
  }
}

const UserBook = mongoose.model('UserBook', userBookSchema)

export default UserBook
