import morgan from 'morgan'
import chalk from 'chalk'

/**
 * Morgan Token để lấy response time
 */
morgan.token('response-time', (req, res) => {
  if (!req.startTime) return '0'
  return `${Date.now() - req.startTime}`
})

/**
 * Morgan Token để lấy content length
 */
morgan.token('content-length', (req, res) => {
  return res.get('content-length') || '-'
})

/**
 * Morgan Format 'dev' - Format giống ngay_23-10
 */
const morganFormat = (tokens, req, res) => {
  const method = tokens.method(req, res)
  let url = tokens.url(req, res)
  const status = tokens.status(req, res)
  const responseTime = tokens['response-time'](req, res)
  const contentLength = tokens['content-length'](req, res)

  // Bỏ "/api" prefix khỏi URL
  if (url.startsWith('/api')) {
    url = url.replace('/api', '')
  }

  // Xác định màu sắc dựa trên status code
  let statusColor
  if (status >= 200 && status < 300) {
    statusColor = chalk.green
  } else if (status >= 400 && status < 500) {
    statusColor = chalk.yellow
  } else if (status >= 500) {
    statusColor = chalk.red
  } else {
    statusColor = chalk.white
  }

  // Format: METHOD URL STATUS RESPONSE_TIMEms - CONTENT_LENGTH (giống ngay_23-10)
  return statusColor(`${method} ${url} ${status} ${responseTime}ms - ${contentLength}`)
}

/**
 * Request Logger Middleware
 * Sử dụng Morgan format 'dev' giống ngay_23-10
 */
export const requestLogger = morgan('dev', {
  // Chỉ log khi response đã hoàn thành
  immediate: false,
  // Skip logging cho health check
  skip: (req, res) => {
    return req.url === '/api/health'
  }
})

/**
 * Simple Request Logger (không dùng Morgan)
 * Log đơn giản với màu sắc
 */
export const simpleRequestLogger = (req, res, next) => {
  const startTime = Date.now()
  
  // Override res.end để capture response time
  const originalEnd = res.end
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime
    const method = req.method
    let url = req.originalUrl
    const status = res.statusCode
    const contentLength = res.get('content-length') || '-'

    // Bỏ "/api" prefix khỏi URL
    if (url.startsWith('/api')) {
      url = url.replace('/api', '')
    }

    // Xác định màu sắc
    let statusColor
    if (status >= 200 && status < 300) {
      statusColor = chalk.green
    } else if (status >= 400 && status < 500) {
      statusColor = chalk.yellow
    } else if (status >= 500) {
      statusColor = chalk.red
    } else {
      statusColor = chalk.white
    }

    // Log request với format giống ảnh
    console.log(statusColor(`${method} ${url} ${status} ${responseTime}ms - ${contentLength}`))
    
    // Call original end
    originalEnd.call(this, chunk, encoding)
  }

  next()
}
