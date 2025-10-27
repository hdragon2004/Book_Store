import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Message from '../models/messageModel.js'
import User from '../models/userModel.js'

// Load environment variables
dotenv.config()

// Connect to database
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://admin:password123@localhost:27017/bookstore?authSource=admin'
    console.log('🔗 Connecting to MongoDB with URI:', mongoUri)
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB for message seeding')
  } catch (error) {
    console.error('❌ Database connection error:', error.message)
    process.exit(1)
  }
}

// Sample messages for chat system
const sampleMessages = [
  {
    content: 'Xin chào! Tôi cần hỗ trợ về đơn hàng của mình.',
    messageType: 'text',
    isRead: false,
    status: 'sent'
  },
  {
    content: 'Chào bạn! Tôi có thể giúp gì cho bạn? Vui lòng cho tôi biết mã đơn hàng.',
    messageType: 'text',
    isRead: true,
    status: 'read'
  },
  {
    content: 'Đơn hàng của tôi có mã là #ORD001. Tôi muốn hủy đơn hàng này.',
    messageType: 'text',
    isRead: false,
    status: 'sent'
  },
  {
    content: 'Tôi đã kiểm tra đơn hàng #ORD001 của bạn. Đơn hàng đang trong quá trình xử lý. Bạn có thể hủy đơn hàng trong vòng 24h kể từ khi đặt.',
    messageType: 'text',
    isRead: true,
    status: 'read'
  },
  {
    content: 'Cảm ơn bạn! Tôi muốn hủy đơn hàng này.',
    messageType: 'text',
    isRead: false,
    status: 'sent'
  },
  {
    content: 'Tôi đã hủy đơn hàng #ORD001 cho bạn. Tiền sẽ được hoàn lại trong vòng 3-5 ngày làm việc.',
    messageType: 'text',
    isRead: true,
    status: 'read'
  },
  {
    content: 'Xin chào admin! Tôi có câu hỏi về sản phẩm.',
    messageType: 'text',
    isRead: false,
    status: 'sent'
  },
  {
    content: 'Chào bạn! Tôi sẵn sàng hỗ trợ bạn. Bạn muốn hỏi về sản phẩm nào?',
    messageType: 'text',
    isRead: true,
    status: 'read'
  },
  {
    content: 'Tôi muốn hỏi về cuốn sách "JavaScript: The Good Parts". Còn hàng không?',
    messageType: 'text',
    isRead: false,
    status: 'sent'
  },
  {
    content: 'Cuốn "JavaScript: The Good Parts" hiện tại còn hàng. Giá là 150,000 VND. Bạn có muốn đặt hàng không?',
    messageType: 'text',
    isRead: true,
    status: 'read'
  }
]

// Seed function
const seedMessages = async () => {
  try {
    console.log('🌱 Starting message seeding...')

    // Clear existing messages
    await Message.deleteMany({})
    console.log('🧹 Cleared existing messages')
    
    // Get users
    const adminUser = await User.findOne({ email: 'admin@bookstore.com' })
    const regularUser = await User.findOne({ email: 'user@bookstore.com' })
    
    if (!adminUser || !regularUser) {
      console.error('❌ Admin or regular user not found. Please run main seed first.')
      return
    }
    
    // Generate conversation ID
    const generateConversationId = (userId1, userId2) => {
      const sortedIds = [userId1.toString(), userId2.toString()].sort()
      return `conv_${sortedIds[0]}_${sortedIds[1]}`
    }
    
    const conversationId = generateConversationId(adminUser._id, regularUser._id)
    
    // Create messages
    const messages = []
    for (let i = 0; i < sampleMessages.length; i++) {
      const messageData = sampleMessages[i]
      const isFromAdmin = i % 2 === 1 // Admin replies to user messages
      
      const message = await Message.create({
        conversationId,
        fromId: isFromAdmin ? adminUser._id : regularUser._id,
        toId: isFromAdmin ? regularUser._id : adminUser._id,
        content: messageData.content,
        messageType: messageData.messageType,
        isRead: messageData.isRead,
        status: messageData.status,
        createdAt: new Date(Date.now() - (sampleMessages.length - i) * 60 * 60 * 1000) // Spread messages over time
      })
      messages.push(message)
    }
    
    console.log('💬 Created messages:', messages.length)
    console.log('✅ Message seeding completed successfully!')
    console.log(`📱 Conversation ID: ${conversationId}`)
    console.log(`👑 Admin: ${adminUser.email}`)
    console.log(`👤 User: ${regularUser.email}`)

  } catch (error) {
    console.error('❌ Message seeding error:', error.message)
    console.error(error)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
    process.exit(0)
  }
}

// Run seeding
const runMessageSeed = async () => {
  await connectDB()
  await seedMessages()
}

runMessageSeed()
