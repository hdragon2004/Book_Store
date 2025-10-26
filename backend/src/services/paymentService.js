import crypto from 'crypto'
import axios from 'axios'
import { config } from '~/config/environment'
import { AppError } from '~/utils/AppError'

/**
 * Payment Service - Xử lý thanh toán qua VNPay và Momo
 */

class PaymentService {
  constructor() {
    this.vnpayConfig = {
      tmnCode: config.VNPAY_TMN_CODE,
      secretKey: config.VNPAY_SECRET_KEY,
      url: config.VNPAY_URL,
      returnUrl: config.VNPAY_RETURN_URL
    }
    
    this.momoConfig = {
      partnerCode: config.MOMO_PARTNER_CODE,
      accessKey: config.MOMO_ACCESS_KEY,
      secretKey: config.MOMO_SECRET_KEY,
      endpoint: config.MOMO_ENDPOINT
    }
  }

  /**
   * Tạo URL thanh toán VNPay
   */
  async createVNPayPayment(orderData) {
    try {
      const {
        orderId,
        amount,
        orderDescription,
        customerInfo
      } = orderData

      const vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: this.vnpayConfig.tmnCode,
        vnp_Amount: amount * 100, // VNPay yêu cầu số tiền nhân 100
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderDescription,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_ReturnUrl: this.vnpayConfig.returnUrl,
        vnp_IpAddr: customerInfo.ipAddress || '127.0.0.1',
        vnp_CreateDate: new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '')
      }

      // Sắp xếp tham số theo thứ tự alphabet
      const sortedParams = this.sortObject(vnp_Params)
      
      // Tạo query string
      const querystring = this.createQueryString(sortedParams)
      
      // Tạo chữ ký
      const secureHash = crypto
        .createHmac('sha512', this.vnpayConfig.secretKey)
        .update(querystring)
        .digest('hex')

      const paymentUrl = `${this.vnpayConfig.url}?${querystring}&vnp_SecureHash=${secureHash}`

      return {
        success: true,
        paymentUrl,
        orderId,
        amount
      }
    } catch (error) {
      throw new AppError(`VNPay payment creation failed: ${error.message}`, 500)
    }
  }

  /**
   * Tạo URL thanh toán Momo
   */
  async createMomoPayment(orderData) {
    try {
      const {
        orderId,
        amount,
        orderDescription,
        customerInfo
      } = orderData

      const requestId = `${Date.now()}`
      const orderInfo = orderDescription
      const redirectUrl = config.MOMO_RETURN_URL
      const ipnUrl = config.MOMO_IPN_URL
      const extraData = ''

      // Tạo raw signature
      const rawSignature = `accessKey=${this.momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.momoConfig.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureMoMoWallet`

      // Tạo signature
      const signature = crypto
        .createHmac('sha256', this.momoConfig.secretKey)
        .update(rawSignature)
        .digest('hex')

      const requestBody = {
        partnerCode: this.momoConfig.partnerCode,
        partnerName: 'Book Store',
        storeId: 'BookStore',
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang: 'vi',
        extraData,
        requestType: 'captureMoMoWallet',
        signature
      }

      const response = await axios.post(this.momoConfig.endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.data.resultCode === 0) {
        return {
          success: true,
          paymentUrl: response.data.payUrl,
          orderId,
          amount,
          requestId: response.data.requestId
        }
      } else {
        throw new AppError(`Momo payment failed: ${response.data.message}`, 400)
      }
    } catch (error) {
      throw new AppError(`Momo payment creation failed: ${error.message}`, 500)
    }
  }

  /**
   * Xác minh callback từ VNPay
   */
  async verifyVNPayCallback(queryParams) {
    try {
      const {
        vnp_SecureHash,
        vnp_TxnRef,
        vnp_ResponseCode,
        vnp_TransactionStatus,
        vnp_Amount
      } = queryParams

      // Loại bỏ vnp_SecureHash khỏi params để tạo signature
      const { vnp_SecureHash: _, ...paramsWithoutHash } = queryParams
      
      // Sắp xếp và tạo query string
      const sortedParams = this.sortObject(paramsWithoutHash)
      const querystring = this.createQueryString(sortedParams)
      
      // Tạo chữ ký
      const secureHash = crypto
        .createHmac('sha512', this.vnpayConfig.secretKey)
        .update(querystring)
        .digest('hex')

      // Kiểm tra chữ ký
      if (secureHash !== vnp_SecureHash) {
        throw new AppError('Invalid VNPay signature', 400)
      }

      return {
        success: vnp_ResponseCode === '00',
        orderId: vnp_TxnRef,
        amount: parseInt(vnp_Amount) / 100, // Chia 100 vì VNPay nhân 100
        transactionId: queryParams.vnp_TransactionNo,
        responseCode: vnp_ResponseCode,
        message: this.getVNPayResponseMessage(vnp_ResponseCode)
      }
    } catch (error) {
      throw new AppError(`VNPay verification failed: ${error.message}`, 400)
    }
  }

  /**
   * Xác minh callback từ Momo
   */
  async verifyMomoCallback(queryParams) {
    try {
      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature
      } = queryParams

      // Tạo raw signature
      const rawSignature = `accessKey=${this.momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`

      // Tạo signature
      const expectedSignature = crypto
        .createHmac('sha256', this.momoConfig.secretKey)
        .update(rawSignature)
        .digest('hex')

      // Kiểm tra chữ ký
      if (expectedSignature !== signature) {
        throw new AppError('Invalid Momo signature', 400)
      }

      return {
        success: resultCode === '0',
        orderId,
        amount: parseInt(amount),
        transactionId: transId,
        resultCode,
        message
      }
    } catch (error) {
      throw new AppError(`Momo verification failed: ${error.message}`, 400)
    }
  }

  /**
   * Hỗ trợ tạo query string
   */
  createQueryString(params) {
    return Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&')
  }

  /**
   * Sắp xếp object theo key
   */
  sortObject(obj) {
    const sorted = {}
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = obj[key]
    })
    return sorted
  }

  /**
   * Lấy thông báo response từ VNPay
   */
  getVNPayResponseMessage(responseCode) {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking',
      '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch',
      '12': 'Giao dịch bị hủy',
      '24': 'Khách hàng hủy giao dịch',
      '51': 'Tài khoản không đủ số dư để thực hiện giao dịch',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định'
    }
    return messages[responseCode] || 'Lỗi không xác định'
  }

  /**
   * Lấy danh sách payments (Admin only)
   */
  async getPayments(params) {
    // Mock data for now - replace with actual database query
    const mockPayments = [
      {
        id: 1,
        orderId: 'ORD-001',
        amount: 850000,
        method: 'vnpay',
        status: 'completed',
        transactionId: 'TXN-001',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:35:00Z'
      },
      {
        id: 2,
        orderId: 'ORD-002',
        amount: 150000,
        method: 'momo',
        status: 'pending',
        transactionId: 'TXN-002',
        createdAt: '2024-01-16T14:20:00Z',
        updatedAt: '2024-01-16T14:20:00Z'
      }
    ]

    return {
      payments: mockPayments,
      totalPayments: mockPayments.length,
      totalPages: 1,
      currentPage: params.page || 1
    }
  }
}

export default new PaymentService()
