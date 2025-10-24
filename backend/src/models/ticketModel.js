import mongoose from 'mongoose'

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: [true, 'Ticket number is required'],
    unique: true,
    uppercase: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  category: {
    type: String,
    enum: [
      'order_issue',
      'payment_problem',
      'shipping_delay',
      'product_question',
      'return_refund',
      'account_issue',
      'technical_support',
      'complaint',
      'suggestion',
      'other'
    ],
    required: [true, 'Category is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_customer', 'waiting_support', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot be more than 50 characters']
  }],
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
  resolution: {
    type: String,
    trim: true,
    maxlength: [1000, 'Resolution cannot be more than 1000 characters']
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
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
ticketSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  this.lastActivityAt = new Date()
  next()
})

// Generate ticket number before saving
ticketSchema.pre('save', function(next) {
  if (this.isNew && !this.ticketNumber) {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substr(2, 4).toUpperCase()
    this.ticketNumber = `TK${timestamp}${random}`
  }
  next()
})

// Indexes for better performance
ticketSchema.index({ userId: 1, createdAt: -1 })
ticketSchema.index({ assignedTo: 1, status: 1 })
ticketSchema.index({ status: 1 })
ticketSchema.index({ priority: 1 })
ticketSchema.index({ category: 1 })
ticketSchema.index({ createdAt: -1 })
ticketSchema.index({ lastActivityAt: -1 })

// Virtual for isOverdue
ticketSchema.virtual('isOverdue').get(function() {
  if (this.status === 'resolved' || this.status === 'closed') return false
  
  const now = new Date()
  const hoursSinceCreation = (now - this.createdAt) / (1000 * 60 * 60)
  
  // Consider overdue based on priority
  const overdueThresholds = {
    'urgent': 2,    // 2 hours
    'high': 8,      // 8 hours
    'medium': 24,   // 24 hours
    'low': 72       // 72 hours
  }
  
  return hoursSinceCreation > overdueThresholds[this.priority]
})

// Virtual for responseTime
ticketSchema.virtual('responseTime').get(function() {
  if (this.status === 'open') return null
  
  // Find first response from support
  // This would need to be calculated from ticket messages
  return null
})

// Method to assign ticket
ticketSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId
  this.status = 'in_progress'
  return this.save()
}

// Method to resolve ticket
ticketSchema.methods.resolve = function(resolution) {
  this.status = 'resolved'
  this.resolution = resolution
  this.resolvedAt = new Date()
  return this.save()
}

// Method to close ticket
ticketSchema.methods.close = function() {
  this.status = 'closed'
  this.closedAt = new Date()
  return this.save()
}

// Static method to find tickets by status
ticketSchema.statics.findByStatus = function(status) {
  return this.find({ status, isDeleted: false })
}

// Static method to find overdue tickets
ticketSchema.statics.findOverdue = function() {
  const now = new Date()
  const overdueThresholds = {
    'urgent': 2 * 60 * 60 * 1000,    // 2 hours
    'high': 8 * 60 * 60 * 1000,      // 8 hours
    'medium': 24 * 60 * 60 * 1000,   // 24 hours
    'low': 72 * 60 * 60 * 1000       // 72 hours
  }

  return this.find({
    status: { $in: ['open', 'in_progress', 'waiting_support'] },
    isDeleted: false,
    $expr: {
      $gt: [
        { $subtract: [now, '$createdAt'] },
        { $switch: {
          branches: [
            { case: { $eq: ['$priority', 'urgent'] }, then: overdueThresholds.urgent },
            { case: { $eq: ['$priority', 'high'] }, then: overdueThresholds.high },
            { case: { $eq: ['$priority', 'medium'] }, then: overdueThresholds.medium },
            { case: { $eq: ['$priority', 'low'] }, then: overdueThresholds.low }
          ],
          default: overdueThresholds.medium
        }}
      ]
    }
  })
}

// Static method to get ticket statistics
ticketSchema.statics.getTicketStats = function() {
  return this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        totalTickets: { $sum: 1 },
        openTickets: {
          $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
        },
        inProgressTickets: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        resolvedTickets: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        closedTickets: {
          $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
        },
        urgentTickets: {
          $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
        }
      }
    }
  ])
}

export default mongoose.model('Ticket', ticketSchema)
