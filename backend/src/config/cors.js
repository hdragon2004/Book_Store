import { isOriginAllowed } from '~/config/environment'

export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Check if origin is allowed using environment config
    if (isOriginAllowed(origin)) {
      return callback(null, true)
    }

    // In development, allow all origins for convenience
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true)
    }

    // In production, only allow specific origins
    return callback(new Error('Not allowed by CORS'))
  },

  // Some legacy browsers (IE11, various SmartTVs) choke on 204
  optionsSuccessStatus: 200,

  // CORS sẽ cho phép nhận cookies từ request
  credentials: true,

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],

  // Exposed headers that the client can access
  exposedHeaders: ['Authorization']
}
