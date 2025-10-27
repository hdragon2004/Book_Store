import Order from '~/models/orderModel'
import OrderItem from '~/models/orderItemModel'
import Book from '~/models/bookModel'
import User from '~/models/userModel'
import Address from '~/models/addressModel'
import Cart from '~/models/cartModel'
import { AppError } from '~/utils/AppError'
import { addOrderConfirmationJob, addOrderStatusUpdateJob } from '~/queue/emailQueue'
import voucherService from '~/services/voucherService'

/**
 * Order Service - Xử lý business logic liên quan đến đơn hàng
 * Theo Service-Based Architecture: Service chứa tất cả business logic
 */

class OrderService {
  /**
   * Tạo đơn hàng mới với địa chỉ đã lưu
   */
  async createOrder(orderData) {
    const { userId, items, shippingAddressId, paymentMethod, note, voucherCode } = orderData

    // Kiểm tra items không rỗng
    if (!items || items.length === 0) {
      throw new AppError('Order items cannot be empty', 400)
    }

    // Kiểm tra địa chỉ giao hàng
    if (!shippingAddressId) {
      throw new AppError('Shipping address is required', 400)
    }

    // Lấy thông tin địa chỉ giao hàng
    const shippingAddress = await Address.findOne({ 
      _id: shippingAddressId, 
      userId, 
      isDeleted: false 
    })
    
    if (!shippingAddress) {
      throw new AppError('Shipping address not found or access denied', 404)
    }

    // Tính tổng tiền và kiểm tra tồn kho
    let totalAmount = 0
    const orderItems = []
    const categoryIds = []
    const bookIds = []

    for (const item of items) {
      const book = await Book.findById(item.bookId).populate('categoryId')
      if (!book) {
        throw new AppError(`Book with ID ${item.bookId} not found`, 404)
      }

      if (book.stock < item.quantity) {
        throw new AppError(`Insufficient stock for book: ${book.title}`, 400)
      }

      const itemTotal = book.price * item.quantity
      totalAmount += itemTotal

      orderItems.push({
        bookId: item.bookId,
        quantity: item.quantity,
        price: book.price,
        total: itemTotal
      })

      // Collect category and book IDs for voucher validation
      if (book.categoryId) {
        categoryIds.push(book.categoryId._id)
      }
      bookIds.push(item.bookId)
    }

    // Xử lý voucher nếu có
    let discountAmount = 0
    let voucherId = null
    let voucherUsageId = null

    if (voucherCode) {
      try {
        const voucherResult = await voucherService.applyVoucher(voucherCode, {
          orderAmount: totalAmount,
          userId,
          categoryIds,
          bookIds
        })

        discountAmount = voucherResult.discountAmount
        voucherId = voucherResult.voucher._id
      } catch (error) {
        throw new AppError(`Voucher error: ${error.message}`, 400)
      }
    }

    // Tính final amount sau khi áp dụng voucher
    const finalAmount = totalAmount - discountAmount

    // Tạo mã đơn hàng
    const orderCode = await this.generateOrderCode()

    // Tạo đơn hàng
    const order = await Order.create({
      orderCode,
      userId,
      totalPrice: finalAmount,
      originalAmount: totalAmount,
      discountAmount,
      voucherId,
      shippingAddressId,
      paymentMethod: paymentMethod || 'cod',
      status: 'pending',
      note
    })

    // Sử dụng voucher nếu có
    if (voucherId) {
      try {
        const voucherUsage = await voucherService.useVoucher(
          voucherId,
          userId,
          order._id,
          totalAmount,
          discountAmount
        )
        voucherUsageId = voucherUsage._id
      } catch (error) {
        // Nếu sử dụng voucher thất bại, xóa đơn hàng
        await Order.findByIdAndDelete(order._id)
        throw new AppError(`Failed to use voucher: ${error.message}`, 500)
      }
    }

    // Tạo OrderItem records
    for (const item of orderItems) {
      await OrderItem.create({
        orderId: order._id,
        bookId: item.bookId,
        quantity: item.quantity,
        priceAtPurchase: item.price
      })
    }

    // Lấy thông tin user để gửi email
    const user = await User.findById(userId).select('name email')
    
    // Gửi email xác nhận đơn hàng
    if (user) {
      console.log('🛒 User found for email:', user.email)
      console.log('🛒 Order object:', order)
      console.log('🛒 Order._id:', order._id)
      
      const orderData = {
        _id: order._id.toString(), // Chuyển đổi ObjectId thành string
        orderCode: order.orderCode,
        totalPrice: order.totalPrice,
        originalAmount: order.originalAmount,
        discountAmount: order.discountAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        userId: {
          _id: user._id.toString(), // Chuyển đổi ObjectId thành string
          name: user.name,
          email: user.email
        },
        shippingAddress: {
          ...shippingAddress.toObject(),
          _id: shippingAddress._id.toString() // Chuyển đổi ObjectId thành string
        }
      }
      
      console.log('🛒 OrderData created:', orderData)
      console.log('🛒 OrderData._id:', orderData._id)
      
      try {
        await addOrderConfirmationJob(user.email, orderData)
        console.log('✅ Order confirmation email queued')
      } catch (error) {
        console.error('❌ Failed to queue order confirmation email:', error.message)
        // Không throw error để không ảnh hưởng đến việc tạo đơn hàng
      }
    } else {
      console.log('⚠️ No user found for email')
    }

    // Xóa các items đã đặt khỏi cart
    try {
      for (const item of items) {
        await Cart.removeItem(userId, item.bookId)
      }
      console.log('🛒 Removed items from cart')
    } catch (error) {
      console.error('❌ Failed to remove items from cart:', error.message)
      // Không throw error để không ảnh hưởng đến việc tạo đơn hàng
    }

    // Populate shipping address trong response
    const populatedOrder = await Order.findById(order._id)
      .populate('shippingAddressId')
      .populate('userId', 'name email')

    console.log('🛒 Returning populated order:', populatedOrder._id)
    return populatedOrder
  }

  /**
   * Tạo mã đơn hàng duy nhất
   */
  async generateOrderCode() {
    const timestamp = Date.now().toString().slice(-8) // 8 số cuối của timestamp
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0') // 3 số ngẫu nhiên
    
    let orderCode = `ORD${timestamp}${random}`
    
    // Kiểm tra mã đơn hàng đã tồn tại chưa
    let existingOrder = await Order.findOne({ orderCode })
    let counter = 1
    
    while (existingOrder) {
      orderCode = `ORD${timestamp}${random}${counter.toString().padStart(2, '0')}`
      existingOrder = await Order.findOne({ orderCode })
      counter++
    }
    
    return orderCode
  }

  /**
   * Lấy đơn hàng của user
   */
  async getUserOrders(userId, filters) {
    const { page, limit, status, sortBy, sortOrder } = filters

    // Xây dựng query
    const query = { userId }
    if (status) {
      query.status = status
    }

    // Xây dựng sort
    const sort = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Tính toán pagination
    const skip = (page - 1) * limit

    // Lấy đơn hàng
    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)

    // Đếm tổng số đơn hàng
    const total = await Order.countDocuments(query)

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Lấy thông tin đơn hàng theo ID
   */
  async getOrderById(orderId, userId, userRole) {
    const query = { _id: orderId }
    
    // Nếu không phải admin, chỉ cho phép xem đơn hàng của mình
    if (userRole !== 'admin') {
      query.userId = userId
    }

    const order = await Order.findOne(query)
      .populate('userId', 'name email phone')
      .populate('items.bookId', 'title author image')

    if (!order) {
      throw new AppError('Order not found', 404)
    }

    return order
  }

  /**
   * Cập nhật trạng thái đơn hàng
   */
  async updateOrderStatus(orderId, status, note) {
    const order = await Order.findById(orderId)
    if (!order) {
      throw new AppError('Order not found', 404)
    }

    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid order status', 400)
    }

    // Cập nhật trạng thái
    order.status = status
    if (note) {
      order.notes = order.notes || []
      order.notes.push({
        message: note,
        timestamp: new Date(),
        type: 'status_update'
      })
    }

    await order.save()

    // Nếu đơn hàng được xác nhận, cập nhật tồn kho
    if (status === 'confirmed') {
      await this.updateBookStock(order.items, 'subtract')
    }

    // Nếu đơn hàng bị hủy, hoàn trả tồn kho
    if (status === 'cancelled' && order.status !== 'cancelled') {
      await this.updateBookStock(order.items, 'add')
    }

    // Gửi email thông báo cập nhật trạng thái đơn hàng
    if (['shipped', 'delivered'].includes(status)) {
      try {
        const user = await User.findById(order.userId).select('name email')
        if (user) {
          const orderData = {
            ...order.toObject(),
            userName: user.name,
            userEmail: user.email
          }
          
          await addOrderStatusUpdateJob(user.email, orderData, status)
          console.log(`✅ Order status update email queued for status: ${status}`)
        }
      } catch (error) {
        console.error('❌ Failed to queue order status update email:', error.message)
        // Không throw error để không ảnh hưởng đến việc cập nhật trạng thái
      }
    }

    return order
  }

  /**
   * Hủy đơn hàng
   */
  async cancelOrder(orderId, userId, reason) {
    const order = await Order.findOne({ _id: orderId, userId })
    if (!order) {
      throw new AppError('Order not found', 404)
    }

    // Kiểm tra trạng thái có thể hủy
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new AppError('Order cannot be cancelled', 400)
    }

    // Cập nhật trạng thái
    order.status = 'cancelled'
    order.notes = order.notes || []
    order.notes.push({
      message: `Order cancelled: ${reason}`,
      timestamp: new Date(),
      type: 'cancellation'
    })

    await order.save()

    // Hoàn trả tồn kho nếu đơn hàng đã được xác nhận
    if (order.status === 'confirmed') {
      await this.updateBookStock(order.items, 'add')
    }

    return order
  }

  /**
   * Lấy tất cả đơn hàng (Admin)
   */
  async getAllOrders(filters) {
    const {
      page,
      limit,
      status,
      userId,
      startDate,
      endDate,
      sortBy,
      sortOrder
    } = filters

    // Xây dựng query
    const query = {}
    if (status) query.status = status
    if (userId) query.userId = userId
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    // Xây dựng sort
    const sort = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Tính toán pagination
    const skip = (page - 1) * limit

    // Lấy đơn hàng
    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(limit)

    // Đếm tổng số đơn hàng
    const total = await Order.countDocuments(query)

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Lấy thống kê đơn hàng
   */
  async getOrderStatistics(period) {
    const now = new Date()
    let startDate

    // Tính ngày bắt đầu theo period
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Thống kê tổng quan
    const overview = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ])

    // Thống kê theo trạng thái
    const statusStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ])

    // Thống kê theo ngày
    const dailyStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ])

    return {
      overview: overview[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0
      },
      statusStats,
      dailyStats
    }
  }

  /**
   * Lấy doanh thu theo thời gian
   */
  async getRevenue(period, groupBy) {
    const now = new Date()
    let startDate

    // Tính ngày bắt đầu theo period
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Xây dựng group theo groupBy
    let groupFormat
    switch (groupBy) {
      case 'hour':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        }
        break
      case 'day':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        }
        break
      case 'month':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        }
        break
      default:
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        }
    }

    // Lấy doanh thu
    const revenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['delivered', 'confirmed'] }
        }
      },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ])

    return revenue
  }

  /**
   * Lấy đơn hàng theo trạng thái
   */
  async getOrdersByStatus(status, filters) {
    const { page, limit, sortBy, sortOrder, userId, userRole } = filters

    // Xây dựng query
    const query = { status }
    if (userRole !== 'admin' && userId) {
      query.userId = userId
    }

    // Xây dựng sort
    const sort = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Tính toán pagination
    const skip = (page - 1) * limit

    // Lấy đơn hàng
    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(limit)

    // Đếm tổng số đơn hàng
    const total = await Order.countDocuments(query)

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Xác nhận thanh toán
   */
  async confirmPayment(orderId, paymentMethod, transactionId) {
    const order = await Order.findById(orderId)
    if (!order) {
      throw new AppError('Order not found', 404)
    }

    // Cập nhật thông tin thanh toán
    order.paymentMethod = paymentMethod
    order.transactionId = transactionId
    order.paymentStatus = 'paid'
    order.status = 'confirmed'

    await order.save()

    // Cập nhật tồn kho
    await this.updateBookStock(order.items, 'subtract')

    return order
  }

  /**
   * Lấy lịch sử đơn hàng
   */
  async getOrderHistory(userId, filters) {
    const { page, limit, year, month } = filters

    // Xây dựng query
    const query = { userId }
    if (year || month) {
      query.createdAt = {}
      if (year) {
        query.createdAt.$gte = new Date(year, 0, 1)
        query.createdAt.$lt = new Date(year + 1, 0, 1)
      }
      if (month) {
        query.createdAt.$gte = new Date(year || new Date().getFullYear(), month - 1, 1)
        query.createdAt.$lt = new Date(year || new Date().getFullYear(), month, 1)
      }
    }

    // Tính toán pagination
    const skip = (page - 1) * limit

    // Lấy lịch sử đơn hàng
    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Đếm tổng số đơn hàng
    const total = await Order.countDocuments(query)

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Xuất báo cáo đơn hàng
   */
  async exportOrders(filters) {
    const { format, startDate, endDate, status } = filters

    // Xây dựng query
    const query = {}
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }
    if (status) query.status = status

    // Lấy đơn hàng
    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })

    // Xử lý xuất file theo format
    if (format === 'csv') {
      // Xử lý xuất CSV (sẽ implement sau)
      return { message: 'CSV export will be implemented' }
    }

    return { orders }
  }

  /**
   * Cập nhật tồn kho sách
   */
  async updateBookStock(items, operation) {
    for (const item of items) {
      const book = await Book.findById(item.bookId)
      if (!book) continue

      if (operation === 'subtract') {
        book.stock -= item.quantity
        if (book.stock < 0) {
          throw new AppError(`Insufficient stock for book: ${book.title}`, 400)
        }
      } else if (operation === 'add') {
        book.stock += item.quantity
      }

      await book.save()
    }
  }
}

export default new OrderService()