import mongoose from 'mongoose'
import Order from '../models/orderModel.js'
import ShippingProvider from '../models/shippingProviderModel.js'
import User from '../models/userModel.js'
import Book from '../models/bookModel.js'
import Address from '../models/addressModel.js'
import { orderService } from '../services/orderService.js'

// Kết nối MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/bookstore')
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

// Test chọn đơn vị vận chuyển
const testShippingSelection = async () => {
  try {
    console.log('🧪 Testing shipping provider selection...')

    // Lấy user đầu tiên
    const user = await User.findOne({ roleId: { $ne: null } })
    if (!user) {
      console.log('❌ No user found')
      return
    }

    // Lấy địa chỉ của user
    const address = await Address.findOne({ userId: user._id })
    if (!address) {
      console.log('❌ No address found for user')
      return
    }

    // Lấy sách đầu tiên
    const book = await Book.findOne({ isDeleted: false })
    if (!book) {
      console.log('❌ No book found')
      return
    }

    // Lấy đơn vị vận chuyển đầu tiên
    const shippingProvider = await ShippingProvider.findOne({ active: true, isDeleted: false })
    if (!shippingProvider) {
      console.log('❌ No active shipping provider found')
      return
    }

    console.log('📋 Test data:')
    console.log('- User:', user.name, user.email)
    console.log('- Address:', address.name, address.address)
    console.log('- Book:', book.title, book.price)
    console.log('- Shipping Provider:', shippingProvider.name, shippingProvider.baseFee)

    // Test tạo đơn hàng với shippingProviderId
    const orderData = {
      userId: user._id,
      items: [{
        bookId: book._id,
        quantity: 1
      }],
      shippingAddressId: address._id,
      shippingProviderId: shippingProvider._id,
      paymentMethod: 'cod'
    }

    console.log('\n🚀 Creating order with selected shipping provider...')
    const order = await orderService.createOrder(orderData)
    
    console.log('✅ Order created successfully!')
    console.log('📦 Order details:')
    console.log('- Order Code:', order.orderCode)
    console.log('- Total Price:', order.totalPrice.toLocaleString('vi-VN'), '₫')
    console.log('- Shipping Fee:', order.shippingFee.toLocaleString('vi-VN'), '₫')
    console.log('- Shipping Provider:', order.shippingProvider.name)
    console.log('- Estimated Time:', order.shippingProvider.estimatedTime)

    // Test tạo đơn hàng không chọn shipping provider (fallback)
    console.log('\n🔄 Testing fallback shipping selection...')
    const orderData2 = {
      userId: user._id,
      items: [{
        bookId: book._id,
        quantity: 2
      }],
      shippingAddressId: address._id,
      paymentMethod: 'cod'
    }

    const order2 = await orderService.createOrder(orderData2)
    console.log('✅ Fallback order created!')
    console.log('- Order Code:', order2.orderCode)
    console.log('- Selected Provider:', order2.shippingProvider.name)
    console.log('- Reason: Auto-selected based on order amount')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Chạy test
const runTest = async () => {
  await connectDB()
  await testShippingSelection()
  await mongoose.disconnect()
  console.log('\n🏁 Test completed!')
}

runTest()
