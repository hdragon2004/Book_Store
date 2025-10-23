import mongoose from 'mongoose'

const favoriteSchema = new mongoose.Schema({
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
  isFavourite: {
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

// Compound index to ensure unique user-book combination
favoriteSchema.index({ userId: 1, bookId: 1 }, { unique: true })

// Update updatedAt before saving
favoriteSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Static method to check if book is favorite for user
favoriteSchema.statics.isBookFavorite = async function(userId, bookId) {
  const favorite = await this.findOne({ userId, bookId })
  return favorite ? favorite.isFavourite : false
}

// Static method to toggle favorite status
favoriteSchema.statics.toggleFavorite = async function(userId, bookId) {
  const favorite = await this.findOne({ userId, bookId })
  
  if (favorite) {
    // Toggle existing favorite
    favorite.isFavourite = !favorite.isFavourite
    await favorite.save()
    return favorite
  } else {
    // Create new favorite with isFavourite = true
    const newFavorite = await this.create({
      userId,
      bookId,
      isFavourite: true
    })
    return newFavorite
  }
}

// Static method to get user's favorite books
favoriteSchema.statics.getUserFavorites = async function(userId, isFavourite = true) {
  return await this.find({ userId, isFavourite })
    .populate('bookId', 'title author price imageUrl categoryId')
    .populate({
      path: 'bookId',
      populate: {
        path: 'categoryId',
        select: 'name'
      }
    })
}

// Static method to get book's favorite count
favoriteSchema.statics.getBookFavoriteCount = async function(bookId) {
  return await this.countDocuments({ bookId, isFavourite: true, isDeleted: false })
}

// Soft delete method
favoriteSchema.methods.softDelete = function() {
  this.isDeleted = true
  return this.save()
}

// Restore method
favoriteSchema.methods.restore = function() {
  this.isDeleted = false
  return this.save()
}

// Static method to find active favorites
favoriteSchema.statics.findActive = function() {
  return this.find({ isDeleted: false })
}

// Static method to find deleted favorites
favoriteSchema.statics.findDeleted = function() {
  return this.find({ isDeleted: true })
}

// Indexes for better performance
favoriteSchema.index({ userId: 1 })
favoriteSchema.index({ bookId: 1 })
favoriteSchema.index({ isDeleted: 1 })
favoriteSchema.index({ isFavourite: 1 })
favoriteSchema.index({ createdAt: -1 })

export default mongoose.model('Favorite', favoriteSchema)
