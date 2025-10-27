import mongoose from 'mongoose'
import Message from './src/models/messageModel.js'
import dotenv from 'dotenv'

dotenv.config()

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore')
    console.log('✅ Connected to MongoDB')
    
    const messages = await Message.find({})
    console.log('📊 Total messages:', messages.length)
    
    if (messages.length > 0) {
      console.log('📝 First message structure:')
      console.log(JSON.stringify(messages[0], null, 2))
      
      // Check isDeleted field
      console.log('\n🔍 Checking isDeleted field:')
      const messagesWithIsDeleted = await Message.find({ isDeleted: false })
      console.log('Messages with isDeleted: false:', messagesWithIsDeleted.length)
      
      const messagesWithoutIsDeleted = await Message.find({ isDeleted: { $exists: false } })
      console.log('Messages without isDeleted field:', messagesWithoutIsDeleted.length)
    }
    
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

connectDB()

