import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Order from '../models/orderModel.js'
import OrderItem from '../models/orderItemModel.js'
import User from '../models/userModel.js'
import Book from '../models/bookModel.js'
import Address from '../models/addressModel.js'
import orderService from '../services/orderService.js'

dotenv.config()

async function testOrderEmail() {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Tìm một order có sẵn để test
    const order = await Order.findOne({ isDeleted: false })
      .populate({
        path: 'orderItems',
        populate: {
          path: 'bookId',
          select: 'title author imageUrl price format'
        }
      })
      .populate('userId', 'name email')
      .populate('shippingAddressId', 'name phone address ward district city')

    if (!order) {
      console.log('❌ No orders found in database')
      return
    }

    console.log('📦 Found order:', order.orderCode)
    console.log('👤 User:', order.userId.name, '(' + order.userId.email + ')')
    console.log('📚 Items count:', order.orderItems.length)

    // Test gửi email
    console.log('\n🧪 Testing order confirmation email...')
    
    try {
      await orderService.sendOrderConfirmationEmail(order)
      console.log('✅ Order confirmation email sent successfully!')
    } catch (error) {
      console.error('❌ Failed to send email:', error.message)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  }
}

testOrderEmail()
