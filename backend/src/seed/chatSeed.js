import mongoose from 'mongoose'
import Message from '../models/messageModel.js'
import User from '../models/userModel.js'
import dotenv from 'dotenv'

dotenv.config()

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore')
    console.log('✅ Connected to MongoDB for chat seeding')
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
    isDeleted: false
  },
  {
    content: 'Chào bạn! Tôi có thể giúp gì cho bạn? Vui lòng cho tôi biết mã đơn hàng.',
    messageType: 'text',
    isRead: true,
    isDeleted: false
  },
  {
    content: 'Đơn hàng của tôi có mã là #ORD001. Tôi muốn hủy đơn hàng này.',
    messageType: 'text',
    isRead: false,
    isDeleted: false
  },
  {
    content: 'Tôi đã kiểm tra đơn hàng #ORD001 của bạn. Đơn hàng đang trong quá trình xử lý. Bạn có thể hủy đơn hàng trong vòng 24h kể từ khi đặt.',
    messageType: 'text',
    isRead: true,
    isDeleted: false
  },
  {
    content: 'Cảm ơn bạn! Tôi muốn hủy đơn hàng này.',
    messageType: 'text',
    isRead: false,
    isDeleted: false
  },
  {
    content: 'Tôi đã hủy đơn hàng #ORD001 cho bạn. Tiền sẽ được hoàn lại trong vòng 3-5 ngày làm việc.',
    messageType: 'text',
    isRead: true,
    isDeleted: false
  },
  {
    content: 'Xin chào admin! Tôi có câu hỏi về sản phẩm.',
    messageType: 'text',
    isRead: false,
    isDeleted: false
  },
  {
    content: 'Chào bạn! Tôi sẵn sàng hỗ trợ bạn. Bạn muốn hỏi về sản phẩm nào?',
    messageType: 'text',
    isRead: true,
    isDeleted: false
  },
  {
    content: 'Tôi muốn hỏi về cuốn sách "JavaScript: The Good Parts". Còn hàng không?',
    messageType: 'text',
    isRead: false,
    isDeleted: false
  },
  {
    content: 'Cuốn "JavaScript: The Good Parts" hiện tại còn hàng. Giá là 150,000 VND. Bạn có muốn đặt hàng không?',
    messageType: 'text',
    isRead: true,
    isDeleted: false
  }
]

// Seed function
const seedChatMessages = async () => {
  try {
    console.log('🌱 Starting chat message seeding...')

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
    
    console.log('👑 Admin User:', adminUser.email)
    console.log('👤 Regular User:', regularUser.email)
    
    // Generate conversation ID theo quy tắc mới
    const conversationId = [adminUser._id.toString(), regularUser._id.toString()].sort().join('_')
    console.log('📱 Conversation ID:', conversationId)
    
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
        isDeleted: messageData.isDeleted,
        createdAt: new Date(Date.now() - (sampleMessages.length - i) * 60 * 60 * 1000) // Spread messages over time
      })
      messages.push(message)
    }
    
    console.log('💬 Created messages:', messages.length)
    console.log('✅ Chat message seeding completed successfully!')
    
    // Test query
    console.log('\n🧪 Testing queries:')
    const allMessages = await Message.find({ isDeleted: false })
    console.log('📊 Total messages with isDeleted: false:', allMessages.length)
    
    const conversations = await Message.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: '$conversationId'
        }
      }
    ])
    console.log('📱 Total conversations:', conversations.length)

  } catch (error) {
    console.error('❌ Chat seeding error:', error.message)
    console.error(error)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
    process.exit(0)
  }
}

// Run seeding
const runChatSeed = async () => {
  await connectDB()
  await seedChatMessages()
}

runChatSeed()

