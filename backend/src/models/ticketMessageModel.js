import mongoose from 'mongoose'

const ticketMessageSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: [true, 'Ticket ID is required']
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot be more than 2000 characters']
  },
  messageType: {
    type: String,
    enum: ['user_message', 'support_response', 'system_note', 'status_change'],
    default: 'user_message'
  },
  isInternal: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
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
ticketMessageSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Indexes for better performance
ticketMessageSchema.index({ ticketId: 1, createdAt: -1 })
ticketMessageSchema.index({ senderId: 1 })
ticketMessageSchema.index({ messageType: 1 })
ticketMessageSchema.index({ isRead: 1 })
ticketMessageSchema.index({ createdAt: -1 })

// Method to mark as read
ticketMessageSchema.methods.markAsRead = function() {
  this.isRead = true
  this.readAt = new Date()
  return this.save()
}

// Static method to find unread messages for user
ticketMessageSchema.statics.findUnreadForUser = function(userId) {
  return this.find({
    senderId: { $ne: userId },
    isRead: false,
    isDeleted: false
  }).populate('ticketId', 'ticketNumber subject status')
}

// Static method to get message statistics
ticketMessageSchema.statics.getMessageStats = function(ticketId) {
  return this.aggregate([
    { $match: { ticketId, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        userMessages: {
          $sum: { $cond: [{ $eq: ['$messageType', 'user_message'] }, 1, 0] }
        },
        supportMessages: {
          $sum: { $cond: [{ $eq: ['$messageType', 'support_response'] }, 1, 0] }
        },
        systemMessages: {
          $sum: { $cond: [{ $eq: ['$messageType', 'system_note'] }, 1, 0] }
        }
      }
    }
  ])
}

export default mongoose.model('TicketMessage', ticketMessageSchema)
