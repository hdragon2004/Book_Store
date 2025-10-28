import dotenv from 'dotenv'
dotenv.config()
import { config } from '~/config/environment'
import connectDB from '~/config/db'
import { app, server, socketHandler } from '~/routes/index'
import memoryQueue from '~/queue/memoryQueue'
import roleService from '~/services/roleService'
import { startAllCronJobs } from '~/jobs/orderStatusJob'

/**
 * Ensure default roles exist in database
 */
const ensureDefaultRoles = async () => {
  try {
    await roleService.ensureBasicRoles()
  } catch (error) {
    console.error('❌ Error ensuring default roles:', error.message)
  }
}

/**
 * Server Entry Point - Khởi tạo server với Service-Based Architecture
 * Kết nối database, Socket.io và khởi động server
 */

const START_SERVER = async () => {
  try {
    // Connect to MongoDB
    await connectDB()

    // Ensure default roles exist
    await ensureDefaultRoles()

    // Start memory queue
    memoryQueue.startProcessing()

    // Start cron jobs
    startAllCronJobs()

    // Start server
    server.listen(config.port, config.host, () => {
      console.log('🚀 Server running on http://localhost:5000')
      console.log('📚 Bookstore API ready!')
    })

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully')
      memoryQueue.stopProcessing()
      server.close(() => {
        console.log('✅ Server closed')
        process.exit(0)
      })
    })

  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Start server
START_SERVER()
