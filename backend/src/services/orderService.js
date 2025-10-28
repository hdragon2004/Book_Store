import Order from '~/models/orderModel'
import OrderItem from '~/models/orderItemModel'
import Book from '~/models/bookModel'
import User from '~/models/userModel'
import Address from '~/models/addressModel'
import Cart from '~/models/cartModel'
import ShippingProvider from '~/models/shippingProviderModel'
import { AppError } from '~/utils/AppError'
import voucherService from '~/services/voucherService'
import { addOrderConfirmationJob } from '~/queue/emailQueue'

/**
 * Order Service - Xử lý business logic liên quan đến đơn hàng
 * Theo Service-Based Architecture: Service chứa tất cả business logic
 */

class OrderService {
  /**
   * Tạo đơn hàng mới với địa chỉ đã lưu
   */
  async createOrder(orderData) {
    const { userId, items, shippingAddressId, shippingProviderId, paymentMethod, note, voucherCode } = orderData

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

    // Lấy thông tin đơn vị giao hàng được chọn
    let selectedProvider = null
    let shippingFee = 0

    if (!shippingProviderId) {
      throw new AppError('Shipping provider is required', 400)
    }

    // Kiểm tra đơn vị vận chuyển được chọn
    selectedProvider = await ShippingProvider.findOne({
      _id: shippingProviderId,
      active: true,
      isDeleted: false
    })
    
    if (!selectedProvider) {
      throw new AppError('Selected shipping provider not found or inactive', 400)
    }
    
    shippingFee = selectedProvider.baseFee

    // Cập nhật tổng tiền bao gồm phí ship
    const finalAmountWithShipping = finalAmount + shippingFee

    // Tạo đơn hàng
    const order = await Order.create({
      orderCode,
      userId,
      totalPrice: finalAmountWithShipping,
      originalAmount: totalAmount,
      discountAmount,
      voucherId,
      shippingAddressId,
      shippingProvider: shippingProviderId,
      shippingFee,
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

    // Đã loại bỏ chức năng gửi email thông báo đơn hàng

    // Xóa các items đã đặt khỏi cart
    try {
      for (const item of items) {
        await Cart.removeItem(userId, item.bookId)
      }
      // Items removed from cart
    } catch (error) {
      console.error('❌ Failed to remove items from cart:', error.message)
      // Không throw error để không ảnh hưởng đến việc tạo đơn hàng
    }

    // Populate shipping address trong response
    const populatedOrder = await Order.findById(order._id)
      .populate('shippingAddressId')
      .populate('userId', 'name email')

    // Gửi email xác nhận đơn hàng cho user
    try {
      await this.sendOrderConfirmationEmail(populatedOrder)
    } catch (error) {
      console.error('❌ Failed to send order confirmation email:', error.message)
      // Không throw error để không ảnh hưởng đến việc tạo đơn hàng
    }

    return populatedOrder
  }

  /**
   * Gửi email xác nhận đơn hàng cho user
   */
  async sendOrderConfirmationEmail(order) {
    try {
      // Lấy order với thông tin user, địa chỉ và đơn vị giao hàng
      const orderWithDetails = await Order.findById(order._id)
        .populate('userId', 'name email')
        .populate('shippingAddressId', 'name phone address ward district city')
        .populate('shippingProvider', 'name code baseFee estimatedTime')

      if (!orderWithDetails) {
        throw new Error('Order not found')
      }

      // Lấy order items riêng biệt
      const orderItems = await OrderItem.find({ orderId: order._id })
        .populate('bookId', 'title author imageUrl price format')

      // Tạo orderData để gửi email với thông tin đầy đủ
      const orderData = {
        _id: orderWithDetails._id.toString(),
        orderCode: orderWithDetails.orderCode,
        userId: {
          _id: orderWithDetails.userId._id.toString(),
          name: orderWithDetails.userId.name,
          email: orderWithDetails.userId.email
        },
        totalPrice: orderWithDetails.totalPrice,
        originalAmount: orderWithDetails.originalAmount,
        discountAmount: orderWithDetails.discountAmount,
        status: orderWithDetails.status,
        paymentMethod: orderWithDetails.paymentMethod,
        shippingAddressId: {
          name: orderWithDetails.shippingAddressId?.name,
          phone: orderWithDetails.shippingAddressId?.phone,
          address: orderWithDetails.shippingAddressId?.address,
          ward: orderWithDetails.shippingAddressId?.ward,
          district: orderWithDetails.shippingAddressId?.district,
          city: orderWithDetails.shippingAddressId?.city
        },
        createdAt: orderWithDetails.createdAt,
        shippingProvider: orderWithDetails.shippingProvider ? {
          _id: orderWithDetails.shippingProvider._id,
          name: orderWithDetails.shippingProvider.name,
          code: orderWithDetails.shippingProvider.code,
          baseFee: orderWithDetails.shippingProvider.baseFee,
          estimatedTime: orderWithDetails.shippingProvider.estimatedTime
        } : null,
        shippingFee: orderWithDetails.shippingFee,
        orderItems: orderItems.map(item => ({
          _id: item._id,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase,
          total: item.quantity * item.priceAtPurchase, // Tính total từ quantity * priceAtPurchase
          bookId: {
            _id: item.bookId._id,
            title: item.bookId.title,
            author: item.bookId.author,
            imageUrl: item.bookId.imageUrl,
            price: item.bookId.price,
            format: item.bookId.format
          }
        }))
      }

      // Thêm job gửi email vào queue
      await addOrderConfirmationJob(orderWithDetails.userId.email, orderData)
      
      console.log(`✅ Order confirmation email queued for user ${orderWithDetails.userId.name} with ${orderData.orderItems.length} items`)
    } catch (error) {
      console.error('❌ Error queuing order confirmation email:', error)
      throw error
    }
  }

  /**
   * Lấy text trạng thái đơn hàng
   */
  getStatusText(status) {
    const statusMap = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'shipped': 'Đang giao hàng',
      'delivered': 'Đã giao hàng',
      'cancelled': 'Đã hủy'
    }
    return statusMap[status] || status
  }

  /**
   * Tạo mã đơn hàng duy nhất
   */
  async generateOrderCode() {
    // Tạo ngày hiện tại theo format YYYYMMDD
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    const dateString = `${year}${month}${day}`
    
    // Tạo 4 số random
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    
    let orderCode = `ORD-${dateString}-${random}`
    
    // Kiểm tra mã đơn hàng đã tồn tại chưa
    let existingOrder = await Order.findOne({ orderCode })
    let counter = 1
    
    while (existingOrder) {
      orderCode = `ORD-${dateString}-${random}${counter.toString().padStart(2, '0')}`
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
    // Đã loại bỏ chức năng gửi email thông báo cập nhật trạng thái đơn hàng

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

  /**
   * Chọn đơn vị giao hàng thông minh dựa trên địa chỉ và giá trị đơn hàng
   */
  async selectShippingProvider(shippingAddress, orderAmount) {
    try {
      // Lấy tất cả đơn vị giao hàng đang hoạt động
      const activeProviders = await ShippingProvider.find({ 
        active: true, 
        isDeleted: false 
      }).sort({ baseFee: 1 }) // Sắp xếp theo phí giao hàng tăng dần

      if (activeProviders.length === 0) {
        console.log('⚠️ Không có đơn vị giao hàng nào đang hoạt động')
        return null
      }

      // Logic chọn đơn vị giao hàng dựa trên các tiêu chí:
      
      // 1. Nếu đơn hàng có giá trị cao (> 500,000 VND), ưu tiên đơn vị có thời gian giao nhanh
      if (orderAmount > 500000) {
        const fastProviders = activeProviders.filter(p => 
          p.estimatedTime && p.estimatedTime.includes('1-2')
        )
        if (fastProviders.length > 0) {
          console.log(`🚀 Chọn đơn vị giao hàng nhanh cho đơn hàng giá trị cao: ${fastProviders[0].name}`)
          return fastProviders[0]
        }
      }

      // 2. Nếu đơn hàng có giá trị trung bình (100,000 - 500,000 VND), chọn đơn vị cân bằng
      if (orderAmount >= 100000 && orderAmount <= 500000) {
        const balancedProviders = activeProviders.filter(p => 
          p.estimatedTime && (p.estimatedTime.includes('2-3') || p.estimatedTime.includes('2-4'))
        )
        if (balancedProviders.length > 0) {
          console.log(`⚖️ Chọn đơn vị giao hàng cân bằng cho đơn hàng trung bình: ${balancedProviders[0].name}`)
          return balancedProviders[0]
        }
      }

      // 3. Nếu đơn hàng có giá trị thấp (< 100,000 VND), chọn đơn vị có phí giao hàng thấp nhất
      if (orderAmount < 100000) {
        console.log(`💰 Chọn đơn vị giao hàng tiết kiệm cho đơn hàng giá trị thấp: ${activeProviders[0].name}`)
        return activeProviders[0]
      }

      // 4. Mặc định: chọn đơn vị đầu tiên (có phí giao hàng thấp nhất)
      console.log(`📦 Chọn đơn vị giao hàng mặc định: ${activeProviders[0].name}`)
      return activeProviders[0]

    } catch (error) {
      console.error('❌ Lỗi khi chọn đơn vị giao hàng:', error)
      // Fallback: chọn đơn vị mặc định
      return await ShippingProvider.getDefaultProvider()
    }
  }
}

export default new OrderService()