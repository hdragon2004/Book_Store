import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  // Người gửi tin nhắn
  fromId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Người nhận tin nhắn (có thể null cho chat group)
  toId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  // URL ảnh nếu có
  imageUrl: {
    type: String,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  }, {
  timestamps: true
})

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 })
messageSchema.index({ fromId: 1 })
messageSchema.index({ toId: 1 })
messageSchema.index({ isRead: 1 })

// Instance methods
messageSchema.methods.markAsRead = function() {
  this.isRead = true
  this.status = 'read'
  this.readAt = new Date()
  return this.save()
}

messageSchema.methods.softDelete = function() {
  this.isDeleted = true
  this.deletedAt = new Date()
  return this.save()
}

messageSchema.methods.restore = function() {
  this.isDeleted = false
  this.deletedAt = null
  return this.save()
}

// Static methods
messageSchema.statics.findByConversationId = function(conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit
  return this.find({ conversationId, isDeleted: false })
    .populate('fromId', 'name email avatar roleId')
    .populate('toId', 'name email avatar roleId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
}

messageSchema.statics.getMessagesBetweenUsers = function(fromId, toId, options = {}) {
  const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = options
  const skip = (page - 1) * limit
  
  const sortOptions = {}
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1
  
  return this.find({
    $or: [
      { fromId, toId },
      { fromId: toId, toId: fromId }
    ],
    isDeleted: false
  })
    .populate('fromId', 'name email avatar roleId')
    .populate('toId', 'name email avatar roleId')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
}

messageSchema.statics.getUnreadMessages = function(userId) {
  return this.find({
    toId: userId,
    isRead: false,
    isDeleted: false
  })
    .populate('fromId', 'name email avatar roleId')
    .sort({ createdAt: -1 })
}

messageSchema.statics.markAllAsReadBetweenUsers = function(fromId, toId) {
  return this.updateMany(
    {
      $or: [
        { fromId, toId },
        { fromId: toId, toId: fromId }
      ],
      isRead: false,
      isDeleted: false
    },
    { 
      $set: { 
        isRead: true,
        status: 'read',
        readAt: new Date()
      } 
    }
  )
}

messageSchema.statics.searchMessages = function(query, options = {}) {
  const { page = 1, limit = 20, fromId, toId, dateFrom, dateTo } = options
  const skip = (page - 1) * limit
  
  const searchQuery = {
    content: { $regex: query, $options: 'i' },
    isDeleted: false
  }
  
  if (fromId) {
    searchQuery.fromId = fromId
  }
  
  if (toId) {
    searchQuery.toId = toId
  }
  
  if (dateFrom || dateTo) {
    searchQuery.createdAt = {}
    if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom)
    if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo)
  }
  
  return this.find(searchQuery)
    .populate('fromId', 'name email avatar roleId')
    .populate('toId', 'name email avatar roleId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
}

messageSchema.statics.getMessageStats = function(options = {}) {
  const { dateFrom, dateTo, conversationId, senderId } = options
  
  const matchQuery = { isDeleted: false }
  
  if (dateFrom || dateTo) {
    matchQuery.createdAt = {}
    if (dateFrom) matchQuery.createdAt.$gte = new Date(dateFrom)
    if (dateTo) matchQuery.createdAt.$lte = new Date(dateTo)
  }
  
  if (conversationId) {
    matchQuery.conversationId = conversationId
  }
  
  if (senderId) {
    matchQuery.fromId = senderId
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        unreadMessages: {
          $sum: {
            $cond: [
              { $eq: ['$isRead', false] },
              1,
              0
            ]
          }
        },
        importantMessages: {
          $sum: {
            $cond: [
              { $eq: ['$isImportant', true] },
              1,
              0
            ]
          }
        },
        pinnedMessages: {
          $sum: {
            $cond: [
              { $eq: ['$isPinned', true] },
              1,
              0
            ]
          }
        }
      }
    }
  ])
}

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

messageSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('vi-VN')
})

export default mongoose.model('Message', messageSchema)