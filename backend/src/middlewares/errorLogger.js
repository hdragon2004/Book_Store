import chalk from 'chalk'

/**
 * Error Logger Middleware
 * Log chi tiết lỗi với màu sắc và thông tin đầy đủ
 */
export const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString()
  const method = req.method
  const url = req.originalUrl
  const statusCode = err.status || err.statusCode || 500
  const responseTime = Date.now() - req.startTime

  // Xác định màu sắc dựa trên status code
  let statusColor
  if (statusCode >= 200 && statusCode < 300) {
    statusColor = chalk.green
  } else if (statusCode >= 400 && statusCode < 500) {
    statusColor = chalk.yellow
  } else if (statusCode >= 500) {
    statusColor = chalk.red
  } else {
    statusColor = chalk.white
  }

  // Log cơ bản với màu sắc (chỉ log lỗi, không log request thành công)
  if (statusCode >= 400) {
    console.log(
      statusColor(`${method} ${url} ${statusCode} ${responseTime}ms`)
    )
  }

  // Nếu có lỗi (status >= 400), chỉ log thông tin cơ bản
  if (statusCode >= 400) {
    console.log(chalk.red(`💥 Error: ${err.message}`))
  }

  next(err)
}

/**
 * Request Timer Middleware
 * Đo thời gian xử lý request
 */
export const requestTimer = (req, res, next) => {
  req.startTime = Date.now()
  next()
}
