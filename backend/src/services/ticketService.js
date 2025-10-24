import Ticket from '~/models/ticketModel'
import TicketMessage from '~/models/ticketMessageModel'
import User from '~/models/userModel'
import { AppError } from '~/utils/AppError'

/**
 * Ticket Service - Xử lý business logic cho support tickets
 */

class TicketService {
  /**
   * Tạo ticket mới
   */
  async createTicket(ticketData) {
    try {
      const {
        userId,
        subject,
        description,
        category,
        priority = 'medium',
        tags = [],
        attachments = []
      } = ticketData

      const ticket = await Ticket.create({
        userId,
        subject,
        description,
        category,
        priority,
        tags,
        attachments
      })

      // Tạo message đầu tiên
      await TicketMessage.create({
        ticketId: ticket._id,
        senderId: userId,
        message: description,
        messageType: 'user_message'
      })

      // Gửi notification cho support team
      await this.notifySupportTeam(ticket)

      return ticket
    } catch (error) {
      throw new AppError(`Failed to create ticket: ${error.message}`, 500)
    }
  }

  /**
   * Lấy danh sách tickets
   */
  async getTickets(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        priority,
        category,
        assignedTo,
        userId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters

      // Build query
      const query = { isDeleted: false }
      
      if (search) {
        query.$or = [
          { ticketNumber: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }
      
      if (status) query.status = status
      if (priority) query.priority = priority
      if (category) query.category = category
      if (assignedTo) query.assignedTo = assignedTo
      if (userId) query.userId = userId

      // Calculate pagination
      const skip = (page - 1) * limit

      // Execute query
      const tickets = await Ticket.find(query)
        .populate('userId', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)

      const total = await Ticket.countDocuments(query)

      return {
        tickets,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    } catch (error) {
      throw new AppError(`Failed to get tickets: ${error.message}`, 500)
    }
  }

  /**
   * Lấy ticket theo ID
   */
  async getTicketById(ticketId, userId = null) {
    try {
      const query = { _id: ticketId, isDeleted: false }
      
      // Nếu có userId, kiểm tra quyền truy cập
      if (userId) {
        const user = await User.findById(userId).select('roleId')
        const isAdmin = user.roleId?.name === 'admin'
        
        if (!isAdmin) {
          query.userId = userId
        }
      }

      const ticket = await Ticket.findOne(query)
        .populate('userId', 'name email')
        .populate('assignedTo', 'name email')

      if (!ticket) {
        throw new AppError('Ticket not found', 404)
      }

      return ticket
    } catch (error) {
      throw new AppError(`Failed to get ticket: ${error.message}`, 500)
    }
  }

  /**
   * Cập nhật ticket
   */
  async updateTicket(ticketId, updateData, userId) {
    try {
      const ticket = await Ticket.findById(ticketId)
      if (!ticket) {
        throw new AppError('Ticket not found', 404)
      }

      // Kiểm tra quyền cập nhật
      const user = await User.findById(userId).select('roleId')
      const isAdmin = user.roleId?.name === 'admin'
      
      if (!isAdmin && ticket.userId.toString() !== userId.toString()) {
        throw new AppError('Unauthorized to update this ticket', 403)
      }

      const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId,
        updateData,
        { new: true, runValidators: true }
      ).populate('userId', 'name email')
        .populate('assignedTo', 'name email')

      // Tạo system note nếu có thay đổi quan trọng
      if (updateData.status && updateData.status !== ticket.status) {
        await this.addSystemNote(ticketId, `Status changed from ${ticket.status} to ${updateData.status}`)
      }

      return updatedTicket
    } catch (error) {
      throw new AppError(`Failed to update ticket: ${error.message}`, 500)
    }
  }

  /**
   * Assign ticket
   */
  async assignTicket(ticketId, assignedTo, assignedBy) {
    try {
      const ticket = await Ticket.findById(ticketId)
      if (!ticket) {
        throw new AppError('Ticket not found', 404)
      }

      ticket.assignedTo = assignedTo
      ticket.status = 'in_progress'
      await ticket.save()

      // Tạo system note
      await this.addSystemNote(ticketId, `Ticket assigned to support agent`, assignedBy)

      // Notification sẽ được gửi qua email thay vì in-app

      return ticket
    } catch (error) {
      throw new AppError(`Failed to assign ticket: ${error.message}`, 500)
    }
  }

  /**
   * Resolve ticket
   */
  async resolveTicket(ticketId, resolution, resolvedBy) {
    try {
      const ticket = await Ticket.findById(ticketId)
      if (!ticket) {
        throw new AppError('Ticket not found', 404)
      }

      ticket.status = 'resolved'
      ticket.resolution = resolution
      ticket.resolvedAt = new Date()
      await ticket.save()

      // Tạo system note
      await this.addSystemNote(ticketId, `Ticket resolved: ${resolution}`, resolvedBy)

      // Notification sẽ được gửi qua email thay vì in-app

      return ticket
    } catch (error) {
      throw new AppError(`Failed to resolve ticket: ${error.message}`, 500)
    }
  }

  /**
   * Close ticket
   */
  async closeTicket(ticketId, closedBy) {
    try {
      const ticket = await Ticket.findById(ticketId)
      if (!ticket) {
        throw new AppError('Ticket not found', 404)
      }

      ticket.status = 'closed'
      ticket.closedAt = new Date()
      await ticket.save()

      // Tạo system note
      await this.addSystemNote(ticketId, 'Ticket closed', closedBy)

      return ticket
    } catch (error) {
      throw new AppError(`Failed to close ticket: ${error.message}`, 500)
    }
  }

  /**
   * Thêm message vào ticket
   */
  async addMessage(ticketId, messageData) {
    try {
      const {
        senderId,
        message,
        messageType = 'user_message',
        isInternal = false,
        attachments = []
      } = messageData

      const ticket = await Ticket.findById(ticketId)
      if (!ticket) {
        throw new AppError('Ticket not found', 404)
      }

      const ticketMessage = await TicketMessage.create({
        ticketId,
        senderId,
        message,
        messageType,
        isInternal,
        attachments
      })

      // Cập nhật last activity của ticket
      ticket.lastActivityAt = new Date()
      await ticket.save()

      // Gửi notification
      if (messageType === 'user_message') {
        // Notify support team
        await this.notifySupportTeam(ticket, ticketMessage)
      } else if (messageType === 'support_response') {
        // Notification sẽ được gửi qua email thay vì in-app
      }

      return ticketMessage
    } catch (error) {
      throw new AppError(`Failed to add message: ${error.message}`, 500)
    }
  }

  /**
   * Lấy messages của ticket
   */
  async getTicketMessages(ticketId, userId = null) {
    try {
      const ticket = await Ticket.findById(ticketId)
      if (!ticket) {
        throw new AppError('Ticket not found', 404)
      }

      // Kiểm tra quyền truy cập
      if (userId) {
        const user = await User.findById(userId).select('roleId')
        const isAdmin = user.roleId?.name === 'admin'
        
        if (!isAdmin && ticket.userId.toString() !== userId.toString()) {
          throw new AppError('Unauthorized to view this ticket', 403)
        }
      }

      const messages = await TicketMessage.find({ ticketId, isDeleted: false })
        .populate('senderId', 'name email')
        .sort({ createdAt: 1 })

      return messages
    } catch (error) {
      throw new AppError(`Failed to get ticket messages: ${error.message}`, 500)
    }
  }

  /**
   * Lấy thống kê tickets
   */
  async getTicketStats() {
    try {
      const stats = await Ticket.getTicketStats()
      const overdueTickets = await Ticket.findOverdue()
      
      return {
        ...stats[0] || {
          totalTickets: 0,
          openTickets: 0,
          inProgressTickets: 0,
          resolvedTickets: 0,
          closedTickets: 0,
          urgentTickets: 0
        },
        overdueTickets: overdueTickets.length
      }
    } catch (error) {
      throw new AppError(`Failed to get ticket stats: ${error.message}`, 500)
    }
  }

  /**
   * Thêm system note
   */
  async addSystemNote(ticketId, message, senderId = null) {
    try {
      return await TicketMessage.create({
        ticketId,
        senderId: senderId,
        message,
        messageType: 'system_note',
        isInternal: true
      })
    } catch (error) {
      console.error('Failed to add system note:', error)
    }
  }

  /**
   * Notify support team
   */
  async notifySupportTeam(ticket, message = null) {
    try {
      // Tìm admin users
      const adminUsers = await User.find({ 'roleId.name': 'admin' }).select('_id')
      
      if (adminUsers.length > 0) {
        const adminIds = adminUsers.map(admin => admin._id)
        
        // Notification sẽ được gửi qua email thay vì in-app
      }
    } catch (error) {
      console.error('Failed to notify support team:', error)
    }
  }
}

export default new TicketService()
