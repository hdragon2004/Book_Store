/**
 * API Response - Class để chuẩn hóa response format
 * Đảm bảo tất cả API responses có format nhất quán
 */

export class ApiResponse {
  constructor(statusCode, data = null, message = 'Success', success = true) {
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = success
    this.timestamp = new Date().toISOString()
  }

  // Static method để tạo success response
  static success(data = null, message = 'Success', statusCode = 200) {
    return new ApiResponse(statusCode, data, message, true)
  }

  // Static method để tạo error response
  static error(message = 'Error', statusCode = 500, data = null) {
    return new ApiResponse(statusCode, data, message, false)
  }

  // Method để convert thành JSON
  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp
    }
  }
}
