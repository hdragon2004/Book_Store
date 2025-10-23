import mongoose from 'mongoose'
import { config } from '~/config/environment'

const connectDB = async () => {
  try {
    // Check if MONGO_URI is defined
    if (!config.mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables')
    }

    await mongoose.connect(config.mongoUri)
    console.log('✅ MongoDB connected')
  } catch (error) {
    console.error('❌ Database connection error:', error.message)
    process.exit(1)
  }
}

export default connectDB
