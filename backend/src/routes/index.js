import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { config, getAllowedOrigins } from '~/config/environment'
import { errorHandler } from '~/middlewares/errorHandler'
import { uploadMiddleware } from '~/middlewares/uploadMiddleware'
import { requestLogger } from '~/middlewares/requestLogger'
import { errorLogger, requestTimer } from '~/middlewares/errorLogger'
import SocketHandler from '~/sockets/socketHandler'

// Import routes
import authRoutes from './authRoutes'
import userRoutes from './userRoutes'
import bookRoutes from './bookRoutes'
import categoryRoutes from './categoryRoutes'
import orderRoutes from './orderRoutes'
import favoriteRoutes from './favoriteRoutes'
import roleRoutes from './roleRoutes'
import cartRoutes from './cartRoutes'
import messageRoutes from './messageRoutes'
import paymentRoutes from './paymentRoutes'
import voucherRoutes from './voucherRoutes'
import reportRoutes from './reportRoutes'
import uploadRoutes from './uploadRoutes'
import downloadRoutes from './downloadRoutes'
import libraryRoutes from './libraryRoutes'
import chatRoutes from './chatRoutes'
import addressRoutes from './addressRoutes'
import shippingProviderRoutes from './shippingProviderRoutes'

/**
 * Express App Configuration
 * Thiết lập middleware, routes và error handling
 */

const app = express()

// Create HTTP server
const server = createServer(app)

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Initialize Socket Handler
const socketHandler = new SocketHandler(io)

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true)
    
    const allowedOrigins = getAllowedOrigins()
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Middleware
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(limiter)

// Logging middleware (phải đặt trước routes)
app.use(requestTimer) // Đo thời gian request
app.use(requestLogger) // Log request với Morgan

// Static files
app.use('/uploads', express.static('uploads'))

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'BookStore API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      books: '/api/books',
      orders: '/api/orders',
      cart: '/api/cart',
      favorites: '/api/favorites'
    }
  })
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connectedUsers: socketHandler.getConnectedUsersCount()
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/books', bookRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/vouchers', voucherRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/download', downloadRoutes)
app.use('/api/library', libraryRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/shipping-providers', shippingProviderRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  })
})

// Error handling middleware (must be last)
app.use(errorLogger) // Log chi tiết lỗi với màu sắc
app.use(errorHandler)

export { app, server, socketHandler }
