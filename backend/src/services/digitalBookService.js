import Book from '~/models/bookModel'
import Order from '~/models/orderModel'
import OrderItem from '~/models/orderItemModel'
import User from '~/models/userModel'
import { addDigitalBookEmailJob } from '~/queue/emailQueue'

/**
 * Xử lý gửi sách điện tử qua email
 */
export const sendDigitalBooks = async (orderId) => {
  try {
    // Lấy thông tin order với items
    const order = await Order.findById(orderId).populate('userId')
    if (!order) {
      throw new Error('Order not found')
    }

    // Lấy tất cả items của order
    const orderItems = await OrderItem.find({ orderId }).populate('bookId')
    
    // Lọc ra các sách điện tử
    const digitalBooks = orderItems.filter(item => item.bookId.isDigital())
    
    if (digitalBooks.length === 0) {
      console.log('No digital books in this order')
      return
    }

    // Chuẩn bị danh sách sách điện tử để gửi
    const booksToSend = digitalBooks.map(item => ({
      title: item.bookId.title,
      author: item.bookId.author,
      format: item.bookId.format,
      fileUrl: item.bookId.fileUrl,
      quantity: item.quantity
    }))
    
  } catch (error) {
    console.error('Error sending digital books:', error)
    throw error
  }
}

/**
 * Kiểm tra order có sách điện tử không
 */
export const hasDigitalBooks = async (orderId) => {
  try {
    const orderItems = await OrderItem.find({ orderId }).populate('bookId')
    return orderItems.some(item => item.bookId.isDigital())
  } catch (error) {
    console.error('Error checking digital books:', error)
    return false
  }
}

/**
 * Xử lý order hỗn hợp (có cả sách vật lý và điện tử)
 */
export const processMixedOrder = async (orderId) => {
  try {
    const hasDigital = await hasDigitalBooks(orderId)
    
    if (hasDigital) {
      // Gửi sách điện tử ngay lập tức
      await sendDigitalBooks(orderId)
      
      // Sách vật lý sẽ được xử lý bình thường (shipping)
      console.log('📦 Physical books will be shipped separately')
    }
  } catch (error) {
    console.error('Error processing mixed order:', error)
    throw error
  }
}
