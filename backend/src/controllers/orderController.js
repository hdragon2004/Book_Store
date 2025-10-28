import Order from '~/models/orderModel'
import OrderItem from '~/models/orderItemModel'
import Cart from '~/models/cartModel'
import Book from '~/models/bookModel'
import User from '~/models/userModel'
import UserBook from '~/models/userBookModel'
import { AppError } from '~/utils/AppError'
import { ApiResponse } from '~/utils/ApiResponse'
import { asyncHandler } from '~/utils/asyncHandler'
import orderService from '~/services/orderService'

/**
 * Order Controller - Xử lý logic đơn hàng
 */

// Tạo đơn hàng mới với địa chỉ đã lưu
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddressId, shippingProviderId, paymentMethod, voucherCode, items, note } = req.body
  const userId = req.user._id

  // Creating order

  // Kiểm tra items được chọn
  if (!items || items.length === 0) {
    throw new AppError('No items selected for order', 400)
  }

  // Kiểm tra địa chỉ giao hàng
  if (!shippingAddressId) {
    throw new AppError('Shipping address is required', 400)
  }

  // Kiểm tra đơn vị vận chuyển
  if (!shippingProviderId) {
    throw new AppError('Shipping provider is required', 400)
  }

  // Gọi service để tạo đơn hàng
  const order = await orderService.createOrder({
    userId,
    items,
    shippingAddressId,
    shippingProviderId,
    paymentMethod,
    voucherCode,
    note
  })

  // Xử lý sách điện tử/sách nói - thêm vào UserBooks
  const digitalBooks = []
  
  for (const item of items) {
    const book = await Book.findById(item.bookId)
    
    if (book && (book.format === 'ebook' || book.format === 'audiobook')) {
      digitalBooks.push({
        userId,
        bookId: item.bookId,
        orderId: order._id,
        bookType: book.format === 'ebook' ? 'ebook' : 'audiobook',
        filePath: book.digitalFile.filePath,
        fileSize: book.digitalFile.fileSize,
        mimeType: book.digitalFile.mimeType
      })
    }
  }

  // Tạo UserBook records cho sách điện tử/sách nói
  if (digitalBooks.length > 0) {
    await UserBook.insertMany(digitalBooks)
    console.log(`📚 Added ${digitalBooks.length} digital books to user library`)
  }

  // Cập nhật stock cho sách vật lý
  for (const item of items) {
    const book = await Book.findById(item.bookId)
    
    if (book && book.format !== 'ebook' && book.format !== 'audiobook') {
      await Book.findByIdAndUpdate(
        item.bookId,
        { $inc: { stock: -item.quantity } }
      )
      // Updated stock for physical book
    }
  }

  // Xóa items khỏi cart sau khi tạo đơn hàng thành công
  const bookIds = items.map(item => item.bookId)
  await Cart.deleteMany({ userId, bookId: { $in: bookIds } })
  // Removed items from cart

  res.status(201).json(
    new ApiResponse(201, { order }, 'Order created successfully')
  )
})

// Lấy danh sách đơn hàng của user
export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { page = 1, limit = 10, status } = req.query

  const query = { userId }
  if (status) {
    query.status = status
  }

  const skip = (page - 1) * limit

  const orders = await Order.find(query)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))

  // Populate orderItems cho mỗi order
  for (let order of orders) {
    const orderItems = await OrderItem.find({ orderId: order._id })
      .populate('bookId')
    order.orderItems = orderItems
  }

  const total = await Order.countDocuments(query)

  res.status(200).json(
    new ApiResponse(200, {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Orders retrieved successfully')
  )
})

// Lấy chi tiết đơn hàng
export const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params
  const userId = req.user._id
  const userRole = req.userRole || 'user'

  // Tạo query dựa trên role
  let query = { _id: orderId }
  
  // Nếu là user thường, chỉ cho phép xem đơn hàng của chính họ
  if (userRole === 'user') {
    query.userId = userId
  }
  // Nếu là admin, có thể xem tất cả đơn hàng

  const order = await Order.findOne(query)
    .populate('userId', 'name email phone address status')
    .populate('shippingProvider', 'name code baseFee estimatedTime')

  if (!order) {
    throw new AppError('Order not found', 404)
  }

  // Lấy order items riêng
  const orderItems = await OrderItem.find({ orderId: order._id })
    .populate({
      path: 'bookId',
      select: 'title author price imageUrl categoryId',
      populate: {
        path: 'categoryId',
        select: 'name'
      }
    })

  // Tạo object response với order và orderItems
  const populatedOrder = {
    ...order.toObject(),
    orderItems
  }

  res.status(200).json(
    new ApiResponse(200, populatedOrder, 'Order retrieved successfully').toJSON()
  )
})

// Cập nhật trạng thái đơn hàng (Admin only)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params
  const { status } = req.body

  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'digital_delivered']
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status', 400)
  }

  // Chuẩn bị update data
  const updateData = { status }
  
  // Thêm timestamp tương ứng
  switch (status) {
    case 'confirmed':
      updateData.confirmedAt = new Date()
      break
    case 'shipped':
      updateData.shippedAt = new Date()
      break
    case 'delivered':
      updateData.deliveredAt = new Date()
      break
    case 'cancelled':
      updateData.cancelledAt = new Date()
      break
  }

  const order = await Order.findByIdAndUpdate(
    orderId,
    updateData,
    { new: true }
  ).populate('userId', 'name email')

  if (!order) {
    throw new AppError('Order not found', 404)
  }

  // Đã loại bỏ chức năng gửi email thông báo trạng thái

  res.status(200).json(
    new ApiResponse(200, order, 'Order status updated successfully')
  )
})

// Hủy đơn hàng (chỉ cho pending và confirmed)
export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params
  const userId = req.user._id

  const order = await Order.findOne({ 
    _id: orderId, 
    userId,
    isDeleted: false 
  })

  if (!order) {
    throw new AppError('Order not found', 404)
  }

  // Chỉ cho phép hủy đơn hàng ở trạng thái pending hoặc confirmed
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new AppError('Cannot cancel order in current status. Only pending and confirmed orders can be cancelled.', 400)
  }

  // Cập nhật trạng thái đơn hàng
  order.status = 'cancelled'
  order.cancelledAt = new Date()
  await order.save()

  // Hoàn lại stock cho sách bìa
  const orderItems = await OrderItem.find({ orderId: order._id })
    .populate('bookId', 'format stock')

  for (const item of orderItems) {
    if (item.bookId.format === 'hardcover' || item.bookId.format === 'paperback') {
      await Book.findByIdAndUpdate(
        item.bookId._id,
        { $inc: { stock: item.quantity } }
      )
    }
  }

  // Xóa UserBooks nếu có (cho sách điện tử đã được giao)
  if (order.status === 'digital_delivered' || order.status === 'confirmed') {
    const deletedUserBooks = await UserBook.deleteMany({ orderId: order._id })
    console.log(`📚 Removed ${deletedUserBooks.deletedCount} digital books from user library`)
  }

  res.status(200).json(
    new ApiResponse(200, { order }, 'Order cancelled successfully')
  )
})

// Lấy đơn hàng (User: chỉ orders của mình, Admin: tất cả orders)
export const getOrders = asyncHandler(async (req, res) => {
  const { page, limit, status, userId, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
  const currentUserId = req.user._id
  const userRole = req.userRole || 'user'

  // Tạo query dựa trên role
  const query = {}
  
  // Nếu là user thường, chỉ lấy orders của user đó
  if (userRole === 'user') {
    query.userId = currentUserId
  }
  // Nếu là admin, có thể lấy tất cả hoặc filter theo userId
  
  if (status) query.status = status
  if (userId && userRole === 'admin') query.userId = userId

  // Thêm search functionality
  if (search) {
    // Search trong user name hoặc email
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }).select('_id')
    
    const userIds = users.map(user => user._id)
    if (userIds.length > 0) {
      // Nếu là admin, search trong tất cả users
      if (userRole === 'admin') {
        query.userId = { $in: userIds }
      } else {
        // Nếu là user, chỉ search trong orders của user đó
        query.userId = currentUserId
      }
    } else {
      // Nếu không tìm thấy user nào, trả về empty result
      query.userId = { $in: [] }
    }
  }

  // Tạo sort object
  const sortObj = {}
  sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1


  let orders
  let total = 0
  let pagination = null

  // Nếu có page và limit thì phân trang, không thì lấy hết
  if (page && limit) {
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    orders = await Order.find(query)
      .populate('userId')
      .populate('shippingProvider', 'name code baseFee estimatedTime')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))

    total = await Order.countDocuments(query)
    
    pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  } else {
    // Lấy tất cả orders không phân trang
    orders = await Order.find(query)
      .populate('userId')
      .populate('shippingProvider', 'name code baseFee estimatedTime')
      .sort(sortObj)
    
    total = orders.length
  }

  // Populate orderItems cho mỗi order
  for (let order of orders) {
    const orderItems = await OrderItem.find({ orderId: order._id })
      .populate('bookId')
    order.orderItems = orderItems
  }

  const responseData = {
    orders,
    total
  }

  // Chỉ thêm pagination nếu có phân trang
  if (pagination) {
    responseData.pagination = pagination
  }

  res.status(200).json(
    new ApiResponse(200, responseData, userRole === 'admin' ? 'All orders retrieved successfully' : 'User orders retrieved successfully').toJSON()
  )
})
