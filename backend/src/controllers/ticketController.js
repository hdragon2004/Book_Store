import { StatusCodes } from 'http-status-codes'
import ticketService from '~/services/ticketService'
import { asyncHandler } from '~/utils/asyncHandler'
import { ApiResponse } from '~/utils/ApiResponse'

/**
 * Ticket Controller - Xử lý các request liên quan đến support tickets
 */

class TicketController {
  /**
   * Tạo ticket mới
   * POST /api/v1/tickets
   */
  createTicket = asyncHandler(async (req, res) => {
    const ticketData = {
      ...req.body,
      userId: req.user._id
    }

    const ticket = await ticketService.createTicket(ticketData)

    res.status(StatusCodes.CREATED).json(
      new ApiResponse(StatusCodes.CREATED, ticket, 'Ticket created successfully')
    )
  })

  /**
   * Lấy danh sách tickets
   * GET /api/v1/tickets
   */
  getTickets = asyncHandler(async (req, res) => {
    const filters = req.query
    
    // Nếu không phải admin, chỉ lấy tickets của user
    const user = req.user
    if (user.roleId?.name !== 'admin') {
      filters.userId = user._id
    }

    const result = await ticketService.getTickets(filters)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Tickets retrieved successfully')
    )
  })

  /**
   * Lấy ticket theo ID
   * GET /api/v1/tickets/:id
   */
  getTicketById = asyncHandler(async (req, res) => {
    const { id } = req.params
    const userId = req.user._id

    const ticket = await ticketService.getTicketById(id, userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, ticket, 'Ticket retrieved successfully')
    )
  })

  /**
   * Cập nhật ticket
   * PUT /api/v1/tickets/:id
   */
  updateTicket = asyncHandler(async (req, res) => {
    const { id } = req.params
    const updateData = req.body
    const userId = req.user._id

    const ticket = await ticketService.updateTicket(id, updateData, userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, ticket, 'Ticket updated successfully')
    )
  })

  /**
   * Assign ticket (Admin only)
   * PUT /api/v1/tickets/:id/assign
   */
  assignTicket = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { assignedTo } = req.body
    const assignedBy = req.user._id

    const ticket = await ticketService.assignTicket(id, assignedTo, assignedBy)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, ticket, 'Ticket assigned successfully')
    )
  })

  /**
   * Resolve ticket (Admin only)
   * PUT /api/v1/tickets/:id/resolve
   */
  resolveTicket = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { resolution } = req.body
    const resolvedBy = req.user._id

    const ticket = await ticketService.resolveTicket(id, resolution, resolvedBy)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, ticket, 'Ticket resolved successfully')
    )
  })

  /**
   * Close ticket (Admin only)
   * PUT /api/v1/tickets/:id/close
   */
  closeTicket = asyncHandler(async (req, res) => {
    const { id } = req.params
    const closedBy = req.user._id

    const ticket = await ticketService.closeTicket(id, closedBy)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, ticket, 'Ticket closed successfully')
    )
  })

  /**
   * Thêm message vào ticket
   * POST /api/v1/tickets/:id/messages
   */
  addMessage = asyncHandler(async (req, res) => {
    const { id } = req.params
    const messageData = {
      ...req.body,
      senderId: req.user._id
    }

    const message = await ticketService.addMessage(id, messageData)

    res.status(StatusCodes.CREATED).json(
      new ApiResponse(StatusCodes.CREATED, message, 'Message added successfully')
    )
  })

  /**
   * Lấy messages của ticket
   * GET /api/v1/tickets/:id/messages
   */
  getTicketMessages = asyncHandler(async (req, res) => {
    const { id } = req.params
    const userId = req.user._id

    const messages = await ticketService.getTicketMessages(id, userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, messages, 'Ticket messages retrieved successfully')
    )
  })

  /**
   * Lấy thống kê tickets (Admin only)
   * GET /api/v1/tickets/stats
   */
  getTicketStats = asyncHandler(async (req, res) => {
    const stats = await ticketService.getTicketStats()

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, stats, 'Ticket statistics retrieved successfully')
    )
  })

  /**
   * Lấy tickets overdue (Admin only)
   * GET /api/v1/tickets/overdue
   */
  getOverdueTickets = asyncHandler(async (req, res) => {
    const Ticket = (await import('~/models/ticketModel')).default
    const overdueTickets = await Ticket.findOverdue()
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email')

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, overdueTickets, 'Overdue tickets retrieved successfully')
    )
  })

  /**
   * Lấy tickets của user
   * GET /api/v1/tickets/my-tickets
   */
  getMyTickets = asyncHandler(async (req, res) => {
    const filters = {
      ...req.query,
      userId: req.user._id
    }

    const result = await ticketService.getTickets(filters)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'My tickets retrieved successfully')
    )
  })

  /**
   * Lấy tickets được assign (Admin only)
   * GET /api/v1/tickets/assigned
   */
  getAssignedTickets = asyncHandler(async (req, res) => {
    const filters = {
      ...req.query,
      assignedTo: req.user._id
    }

    const result = await ticketService.getTickets(filters)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Assigned tickets retrieved successfully')
    )
  })
}

export default new TicketController()
