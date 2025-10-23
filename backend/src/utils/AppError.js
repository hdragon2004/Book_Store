/**
 * App Error - Custom error class cho ứng dụng
 * Kế thừa từ Error class và thêm các thuộc tính cần thiết
 */

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}
