import mongoose from 'mongoose'

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  items: [{
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book ID is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [99, 'Quantity cannot exceed 99']
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalItems: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
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

// Update updatedAt before saving
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Calculate totals before saving
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0)
  next()
})

// Static method to get user's cart with populated book details
cartSchema.statics.getUserCart = async function(userId) {
  return await this.findOne({ userId })
    .populate({
      path: 'items.bookId',
      select: 'title author price imageUrl stock categoryId',
      populate: {
        path: 'categoryId',
        select: 'name'
      }
    })
}

// Static method to add item to cart
cartSchema.statics.addItem = async function(userId, bookId, quantity = 1) {
  let cart = await this.findOne({ userId })
  
  if (!cart) {
    cart = await this.create({ userId, items: [] })
  }

  // Check if book already exists in cart
  const existingItem = cart.items.find(item => item.bookId.toString() === bookId.toString())
  
  if (existingItem) {
    // Update quantity
    existingItem.quantity += quantity
  } else {
    // Add new item
    cart.items.push({ bookId, quantity })
  }

  await cart.save()
  
  // Populate dữ liệu bookId sau khi thêm
  return await this.getUserCart(userId)
}

// Static method to update item quantity
cartSchema.statics.updateItemQuantity = async function(userId, bookId, quantity) {
  const cart = await this.findOne({ userId })
  
  if (!cart) {
    throw new Error('Cart not found')
  }

  const item = cart.items.find(item => item.bookId.toString() === bookId.toString())
  
  if (!item) {
    throw new Error('Item not found in cart')
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    cart.items = cart.items.filter(item => item.bookId.toString() !== bookId.toString())
  } else {
    item.quantity = quantity
  }

  await cart.save()
  
  // Populate dữ liệu bookId sau khi cập nhật
  return await this.getUserCart(userId)
}

// Static method to remove item from cart
cartSchema.statics.removeItem = async function(userId, bookId) {
  const cart = await this.findOne({ userId })
  
  if (!cart) {
    throw new Error('Cart not found')
  }

  cart.items = cart.items.filter(item => item.bookId.toString() !== bookId.toString())
  await cart.save()
  
  // Populate dữ liệu bookId sau khi xóa
  return await this.getUserCart(userId)
}

// Static method to clear cart
cartSchema.statics.clearCart = async function(userId) {
  const cart = await this.findOne({ userId })
  
  if (!cart) {
    throw new Error('Cart not found')
  }

  cart.items = []
  await cart.save()
  
  // Populate dữ liệu bookId sau khi xóa tất cả
  return await this.getUserCart(userId)
}

// Static method to get cart summary
cartSchema.statics.getCartSummary = async function(userId) {
  const cart = await this.getUserCart(userId)
  
  if (!cart) {
    return {
      totalItems: 0,
      totalPrice: 0,
      items: []
    }
  }

  // Calculate total price
  let totalPrice = 0
  const itemsWithPrice = cart.items.map(item => {
    const itemTotal = item.bookId.price * item.quantity
    totalPrice += itemTotal
    return {
      ...item.toObject(),
      totalPrice: itemTotal
    }
  })

  return {
    totalItems: cart.totalItems,
    totalPrice,
    items: itemsWithPrice
  }
}

// Soft delete method
cartSchema.methods.softDelete = function() {
  this.isDeleted = true
  return this.save()
}

// Restore method
cartSchema.methods.restore = function() {
  this.isDeleted = false
  return this.save()
}

// Static method to find active carts
cartSchema.statics.findActive = function() {
  return this.find({ isDeleted: false })
}

// Static method to find deleted carts
cartSchema.statics.findDeleted = function() {
  return this.find({ isDeleted: true })
}

// Static method to remove specific items from cart
cartSchema.statics.removeItems = async function(userId, bookIds) {
  const cart = await this.findOne({ userId, isDeleted: false })
  if (!cart) {
    throw new Error('Cart not found')
  }

  // Remove items with matching bookIds
  cart.items = cart.items.filter(item => !bookIds.includes(item.bookId.toString()))
  
  // Recalculate totals
  cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0)
  
  await cart.save()
  return cart
}

// Indexes for better performance
cartSchema.index({ isDeleted: 1 })
cartSchema.index({ createdAt: -1 })

export default mongoose.model('Cart', cartSchema)
