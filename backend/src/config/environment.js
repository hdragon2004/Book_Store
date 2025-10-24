// Environment configuration
export const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // CORS configuration
  corsOrigins: {
    development: [
      'http://localhost:3000',    // React
      'http://localhost:3001',    // React alternative
      'http://localhost:5173',    // Vite
      'http://localhost:8080',    // Vue
      'http://localhost:4200',    // Angular
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:4200'
    ],
    production: [
      // Add your production domains here
      // 'https://yourdomain.com',
      // 'https://www.yourdomain.com'
    ]
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000 // limit each IP to 1000 requests per windowMs (increased for development)
  },

  // File upload
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '10mb',
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ]
  },

  // Payment configuration
  payment: {
    // VNPay configuration
    vnpay: {
      tmnCode: process.env.VNPAY_TMN_CODE || 'YOUR_TMN_CODE',
      secretKey: process.env.VNPAY_SECRET_KEY || 'YOUR_SECRET_KEY',
      url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/v1/payments/vnpay/callback',
      ipnUrl: process.env.VNPAY_IPN_URL || 'http://localhost:5000/api/v1/payments/vnpay/ipn'
    },
    // Momo configuration
    momo: {
      partnerCode: process.env.MOMO_PARTNER_CODE || 'YOUR_PARTNER_CODE',
      accessKey: process.env.MOMO_ACCESS_KEY || 'YOUR_ACCESS_KEY',
      secretKey: process.env.MOMO_SECRET_KEY || 'YOUR_SECRET_KEY',
      endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
      returnUrl: process.env.MOMO_RETURN_URL || 'http://localhost:5000/api/v1/payments/momo/callback',
      ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:5000/api/v1/payments/momo/ipn'
    }
  },

  // Frontend URL for redirects
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
}

// Helper function to get allowed origins based on environment
export const getAllowedOrigins = () => {
  if (config.nodeEnv === 'development') {
    return config.corsOrigins.development
  }
  return config.corsOrigins.production
}

// Helper function to check if origin is allowed
export const isOriginAllowed = (origin) => {
  if (!origin) return true // Allow requests with no origin
  
  const allowedOrigins = getAllowedOrigins()
  
  // In development, allow all localhost origins
  if (config.nodeEnv === 'development') {
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return true
    }
  }
  
  return allowedOrigins.includes(origin)
}
