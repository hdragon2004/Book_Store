import Order from '~/models/orderModel'
import OrderItem from '~/models/orderItemModel'
import Cart from '~/models/cartModel'
import Book from '~/models/bookModel'
import User from '~/models/userModel'
import AppError from '~/utils/AppError'
import ApiResponse from '~/utils/ApiResponse'
import { asyncHandler } from '~/utils/asyncHandler'
import { sendOrderConfirmationEmail, sendShippingNotificationEmail } from '~/services/emailService'

/**
 * Order Controller - Xử lý logic đơn hàng
 */

// Tạo đơn hàng mới
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body
    const userId = req.user._id

  console.log('🛒 Creating order for user:', userId)
  console.log('🛒 Shipping address:', shippingAddress)
  console.log('🛒 Payment method:', paymentMethod)

  // Lấy giỏ hàng của user
  const cart = await Cart.getUserCart(userId)
  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400)
  }

  // Kiểm tra stock và tính tổng giá
  let totalPrice = 0
  const orderItems = []

  for (const item of cart.items) {
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
    shippingAddress
  })

  // Tạo order items
  for (const item of orderItems) {
    await OrderItem.create({
      orderId: order._id,
      bookId: item.bookId,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase
    })

    // Cập nhật stock
    await Book.findByIdAndUpdate(
      item.bookId,
      { $inc: { stock: -item.quantity } }
    )
  }

  // Xóa giỏ hàng
  await Cart.clearCart(userId)

  // Lấy order items riêng
  const populatedOrderItems = await OrderItem.find({ orderId: order._id })
    .populate('bookId', 'title author price imageUrl')

  // Tạo object response với order và orderItems
  const populatedOrder = {
    ...order.toObject(),
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
    new ApiResponse(201, populatedOrder, 'Order created successfully')
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
      .populate('bookId', 'title author price imageUrl')
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
  const userId = req.user.id

  const order = await Order.findOne({ _id: orderId, userId })
    .populate('userId', 'name email phone')

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
    new ApiResponse(200, populatedOrder, 'Order retrieved successfully')
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

  const order = await Order.findByIdAndUpdate(
    orderId,
    { status },
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

// Hủy đơn hàng
export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params
    const userId = req.user._id

  const order = await Order.findOne({ _id: orderId, userId })
  if (!order) {
    throw new AppError('Order not found', 404)
  }

  if (order.status === 'delivered' || order.status === 'cancelled') {
    throw new AppError('Cannot cancel this order', 400)
  }

  // Hoàn lại stock
  const orderItems = await OrderItem.find({ orderId })
  for (const item of orderItems) {
    await Book.findByIdAndUpdate(
      item.bookId,
      { $inc: { stock: item.quantity } }
    )
  }

  // Cập nhật trạng thái
  order.status = 'cancelled'
  await order.save()

  res.status(200).json(
    new ApiResponse(200, order, 'Order cancelled successfully')
  )
})

// Lấy tất cả đơn hàng (Admin only)
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, userId } = req.query

  const query = {}
  if (status) query.status = status
  if (userId) query.userId = userId

  const skip = (page - 1) * limit

  const orders = await Order.find(query)
    .populate('userId', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))

  // Populate orderItems cho mỗi order
  for (let order of orders) {
    const orderItems = await OrderItem.find({ orderId: order._id })
      .populate('bookId', 'title author price imageUrl')
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
    }, 'All orders retrieved successfully')
  )
})