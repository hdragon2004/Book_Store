import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  // Người gửi tin nhắn
  fromId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  
  // Người nhận tin nhắn (có thể là user hoặc admin)
  toId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver is required']
  },
  
  // Nội dung tin nhắn
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  
  // File đính kèm (nếu có)
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }],
  
  // Trạng thái tin nhắn
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  
  // Thời gian đọc tin nhắn
  readAt: {
    type: Date,
    default: null
  },
  
  // Tin nhắn đã bị xóa chưa
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  // Thời gian tạo
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Thời gian cập nhật
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Indexes để tối ưu performance
messageSchema.index({ fromId: 1, createdAt: -1 })
messageSchema.index({ toId: 1, createdAt: -1 })
messageSchema.index({ status: 1, createdAt: -1 })

// Text search index
messageSchema.index({ content: 'text' })

// Auto update updatedAt
messageSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Virtual để lấy thông tin sender
messageSchema.virtual('sender', {
  ref: 'User',
  localField: 'fromId',
  foreignField: '_id',
  justOne: true
})

// Virtual để lấy thông tin receiver
messageSchema.virtual('receiver', {
  ref: 'User',
  localField: 'toId',
  foreignField: '_id',
  justOne: true
})

// Method để đánh dấu đã đọc
messageSchema.methods.markAsRead = function() {
  this.status = 'read'
  this.readAt = new Date()
  return this.save()
}

// Method để đánh dấu đã gửi
messageSchema.methods.markAsDelivered = function() {
  this.status = 'delivered'
  return this.save()
}

// Method để xóa mềm tin nhắn
messageSchema.methods.softDelete = function() {
  this.isDeleted = true
  return this.save()
}

// Method để khôi phục tin nhắn
messageSchema.methods.restore = function() {
  this.isDeleted = false
  return this.save()
}

// Static method để lấy tin nhắn giữa 2 user
messageSchema.statics.getMessagesBetweenUsers = function(fromId, toId, options = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options

  const query = {
    $or: [
      { fromId, toId },
      { fromId: toId, toId: fromId }
    ],
    isDeleted: false
  }

  return this.find(query)
    .populate('fromId', 'name email avatar roleId')
    .populate('toId', 'name email avatar roleId')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .skip((page - 1) * limit)
    .limit(limit)
}

// Static method để lấy tin nhắn chưa đọc
messageSchema.statics.getUnreadMessages = function(userId) {
  return this.find({
    toId: userId,
    status: { $in: ['sent', 'delivered'] },
    isDeleted: false
  })
  .populate('fromId', 'name email avatar')
  .sort({ createdAt: -1 })
}

// Static method để đánh dấu tất cả tin nhắn đã đọc giữa 2 user
messageSchema.statics.markAllAsReadBetweenUsers = function(fromId, toId) {
  return this.updateMany(
    {
      fromId,
      toId,
      status: { $in: ['sent', 'delivered'] }
    },
    {
      status: 'read',
      readAt: new Date()
    }
  )
}

// Static method để tìm kiếm tin nhắn
messageSchema.statics.searchMessages = function(query, options = {}) {
  const {
    page = 1,
    limit = 20,
    fromId,
    toId,
    dateFrom,
    dateTo
  } = options

  const searchQuery = {
    isDeleted: false,
    $text: { $search: query }
  }

  if (fromId) searchQuery.fromId = fromId
  if (toId) searchQuery.toId = toId
  if (dateFrom || dateTo) {
    searchQuery.createdAt = {}
    if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom)
    if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo)
  }

  return this.find(searchQuery)
    .populate('fromId', 'name email avatar')
    .populate('toId', 'name email avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
}

// Static method để lấy thống kê tin nhắn
messageSchema.statics.getMessageStats = function(options = {}) {
  const {
    dateFrom,
    dateTo,
    fromId,
    toId
  } = options

  const matchQuery = { isDeleted: false }
  
  if (dateFrom || dateTo) {
    matchQuery.createdAt = {}
    if (dateFrom) matchQuery.createdAt.$gte = new Date(dateFrom)
    if (dateTo) matchQuery.createdAt.$lte = new Date(dateTo)
  }
  
  if (fromId) matchQuery.fromId = fromId
  if (toId) matchQuery.toId = toId

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        unreadMessages: {
          $sum: {
            $cond: [
              { $in: ['$status', ['sent', 'delivered']] },
              1,
              0
            ]
          }
        }
      }
    }
  ])
}

export default mongoose.model('Message', messageSchema)
