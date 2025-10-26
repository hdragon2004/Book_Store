import Order from '~/models/orderModel'
import OrderItem from '~/models/orderItemModel'
import Cart from '~/models/cartModel'
import Book from '~/models/bookModel'
import User from '~/models/userModel'
import UserBook from '~/models/userBookModel'
import { AppError } from '~/utils/AppError'
import { ApiResponse } from '~/utils/ApiResponse'
import { asyncHandler } from '~/utils/asyncHandler'
import { sendOrderConfirmationEmail, sendShippingNotificationEmail } from '~/services/emailService'

/**
 * Order Controller - Xử lý logic đơn hàng
 */

// Tạo đơn hàng mới
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, voucher, items } = req.body
    const userId = req.user._id

  console.log('🛒 Creating order for user:', userId)
  console.log('🛒 Shipping address:', shippingAddress)
  console.log('🛒 Payment method:', paymentMethod)
  console.log('🛒 Selected items:', items)

  // Kiểm tra items được chọn
  if (!items || items.length === 0) {
    throw new AppError('No items selected for order', 400)
  }

  // Kiểm tra stock và tính tổng giá cho các items được chọn
  let totalPrice = 0
  const orderItems = []

  for (const item of items) {
    const book = await Book.findById(item.bookId)
    if (!book) {
      throw new AppError(`Book ${item.bookId} not found`, 404)
    }

    if (book.stock < item.quantity) {
      throw new AppError(`Insufficient stock for ${book.title}. Available: ${book.stock}`, 400)
    }

    const itemTotal = book.price * item.quantity
    totalPrice += itemTotal

    orderItems.push({
      bookId: item.bookId,
      quantity: item.quantity,
      priceAtPurchase: book.price
    })
  }

  // Tạo đơn hàng
  const order = await Order.create({
    userId,
    totalPrice,
    paymentMethod: paymentMethod || 'cod',
    shippingAddress,
    voucherId: voucher?.voucherId || null,
    discountAmount: voucher?.discountAmount || 0
  })

  // Tạo order items và xử lý sách điện tử/sách nói
  const digitalBooks = []
  const physicalBooks = []
  
  for (const item of orderItems) {
    await OrderItem.create({
      orderId: order._id,
      bookId: item.bookId,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase
    })

    // Lấy thông tin sách để kiểm tra loại
    const book = await Book.findById(item.bookId)
    
    if (book.format === 'ebook' || book.format === 'audiobook') {
      // Sách điện tử/sách nói - thêm vào UserBooks
      digitalBooks.push({
        userId,
        bookId: item.bookId,
        orderId: order._id,
        bookType: book.format === 'ebook' ? 'ebook' : 'audiobook',
        filePath: book.digitalFile.filePath,
        fileSize: book.digitalFile.fileSize,
        mimeType: book.digitalFile.mimeType
      })
    } else {
      // Sách bìa cứng/mềm - cập nhật stock
      physicalBooks.push(item)
      await Book.findByIdAndUpdate(
        item.bookId,
        { $inc: { stock: -item.quantity } }
      )
    }
  }

  // Tạo UserBooks cho sách điện tử/sách nói
  if (digitalBooks.length > 0) {
    // Kiểm tra và chỉ tạo UserBook cho những sách chưa có
    const existingUserBooks = await UserBook.find({
      userId,
      bookId: { $in: digitalBooks.map(book => book.bookId) }
    })
    
    const existingBookIds = existingUserBooks.map(book => book.bookId.toString())
    const newDigitalBooks = digitalBooks.filter(book => 
      !existingBookIds.includes(book.bookId.toString())
    )
    
    if (newDigitalBooks.length > 0) {
      await UserBook.insertMany(newDigitalBooks)
      console.log(`📚 Added ${newDigitalBooks.length} new digital books to user library`)
    } else {
      console.log(`📚 All digital books already exist in user library`)
    }
    
    // Nếu có sách đã tồn tại, thông báo cho user
    if (digitalBooks.length > newDigitalBooks.length) {
      const duplicateCount = digitalBooks.length - newDigitalBooks.length
      console.log(`⚠️ ${duplicateCount} books already in user library`)
    }
  }

  // Cập nhật trạng thái đơn hàng dựa trên loại sách
  if (digitalBooks.length > 0 && physicalBooks.length === 0) {
    // Chỉ có sách điện tử/sách nói - giao hàng ngay lập tức
    await Order.findByIdAndUpdate(order._id, { 
      status: 'digital_delivered',
      deliveredAt: new Date()
    })
    console.log('📱 Order marked as digital delivered')
  } else if (digitalBooks.length > 0 && physicalBooks.length > 0) {
    // Có cả sách bìa và sách điện tử - giao sách điện tử trước, sách bìa chờ xác nhận
    await Order.findByIdAndUpdate(order._id, { 
      status: 'pending' // Sách bìa cần admin xác nhận
    })
    console.log('📦 Mixed order - digital books delivered, physical books pending admin confirmation')
  } else if (physicalBooks.length > 0) {
    // Chỉ có sách bìa - chờ admin xác nhận
    await Order.findByIdAndUpdate(order._id, { 
      status: 'pending'
    })
    console.log('📦 Physical books order - pending admin confirmation')
  }

  // Xóa các items đã chọn khỏi giỏ hàng
  const selectedBookIds = items.map(item => item.bookId)
  await Cart.removeItems(userId, selectedBookIds)
  console.log(`🛒 Removed ${selectedBookIds.length} selected items from cart`)

  // Lấy order items riêng
  const populatedOrderItems = await OrderItem.find({ orderId: order._id })
    .populate('bookId', 'title author price imageUrl')

  // Populate user cho email
  const orderWithUser = await Order.findById(order._id)
    .populate('userId', 'name email')

  // Tạo object response với order và orderItems
  const populatedOrder = {
    ...orderWithUser.toObject(),
    orderItems: populatedOrderItems
  }

  // Gửi email xác nhận đơn hàng
  try {
    await sendOrderConfirmationEmail(populatedOrder)
    console.log('✅ Order confirmation email sent')
  } catch (emailError) {
    console.error('❌ Failed to send order confirmation email:', emailError)
    // Không throw error để không ảnh hưởng đến việc tạo đơn hàng
  }

  res.status(201).json(
    new ApiResponse(201, populatedOrder, 'Order created successfully').toJSON()
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
  const { status, shipper } = req.body

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
      if (shipper) {
        updateData.shipper = shipper
      }
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

  // Gửi email thông báo trạng thái
  try {
    if (status === 'shipped') {
      await sendShippingNotificationEmail(order)
      console.log('✅ Shipping notification email sent')
    }
  } catch (emailError) {
    console.error('❌ Failed to send shipping notification email:', emailError)
  }

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
