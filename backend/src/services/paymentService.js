import crypto from 'crypto'
import axios from 'axios'
import { config } from '~/config/environment'
import { AppError } from '~/utils/AppError'
import Payment from '~/models/paymentModel'

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

      // Tạo payment record
      const payment = new Payment({
        orderId,
        amount,
        method: 'vnpay',
        status: 'pending',
        description: orderDescription,
        customerInfo: {
          ipAddress: customerInfo.ipAddress || '127.0.0.1',
          userAgent: customerInfo.userAgent
        }
      })

      await payment.save()

      const vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: this.vnpayConfig.tmnCode,
        vnp_Amount: amount * 100, // VNPay yêu cầu số tiền nhân 100
        vnp_CurrCode: 'VND',
        vnp_TxnRef: payment.transactionCode, // Sử dụng transactionCode thay vì orderId
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

      // Cập nhật paymentUrl vào payment record
      payment.paymentUrl = paymentUrl
      await payment.save()

      return {
        success: true,
        paymentUrl,
        orderId,
        amount,
        transactionCode: payment.transactionCode,
        paymentId: payment._id
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

      // Tạo payment record
      const payment = new Payment({
        orderId,
        amount,
        method: 'momo',
        status: 'pending',
        description: orderDescription,
        customerInfo: {
          ipAddress: customerInfo.ipAddress || '127.0.0.1',
          userAgent: customerInfo.userAgent
        }
      })

      await payment.save()

      const requestId = `${Date.now()}`
      const orderInfo = orderDescription
      const redirectUrl = config.MOMO_RETURN_URL
      const ipnUrl = config.MOMO_IPN_URL
      const extraData = ''

      // Tạo raw signature
      const rawSignature = `accessKey=${this.momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${payment.transactionCode}&orderInfo=${orderInfo}&partnerCode=${this.momoConfig.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureMoMoWallet`

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
        orderId: payment.transactionCode, // Sử dụng transactionCode
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
        // Cập nhật paymentUrl vào payment record
        payment.paymentUrl = response.data.payUrl
        await payment.save()

        return {
          success: true,
          paymentUrl: response.data.payUrl,
          orderId,
          amount,
          requestId: response.data.requestId,
          transactionCode: payment.transactionCode,
          paymentId: payment._id
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

      // Tìm payment record theo transactionCode
      const payment = await Payment.findByTransactionCode(vnp_TxnRef)
      if (!payment) {
        throw new AppError('Payment not found', 404)
      }

      const isSuccess = vnp_ResponseCode === '00'
      
      // Cập nhật payment status
      await payment.updateStatus(
        isSuccess ? 'completed' : 'failed',
        queryParams.vnp_TransactionNo,
        queryParams
      )

      return {
        success: isSuccess,
        orderId: payment.orderId,
        amount: parseInt(vnp_Amount) / 100, // Chia 100 vì VNPay nhân 100
        transactionId: queryParams.vnp_TransactionNo,
        responseCode: vnp_ResponseCode,
        message: this.getVNPayResponseMessage(vnp_ResponseCode),
        transactionCode: payment.transactionCode,
        paymentId: payment._id
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

      // Tìm payment record theo transactionCode
      const payment = await Payment.findByTransactionCode(orderId)
      if (!payment) {
        throw new AppError('Payment not found', 404)
      }

      const isSuccess = resultCode === '0'
      
      // Cập nhật payment status
      await payment.updateStatus(
        isSuccess ? 'completed' : 'failed',
        transId,
        queryParams
      )

      return {
        success: isSuccess,
        orderId: payment.orderId,
        amount: parseInt(amount),
        transactionId: transId,
        resultCode,
        message,
        transactionCode: payment.transactionCode,
        paymentId: payment._id
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
    try {
      const { page = 1, limit = 10, status, method, startDate, endDate } = params
      
      // Tạo query filter
      const filter = {}
      if (status) filter.status = status
      if (method) filter.method = method
      if (startDate || endDate) {
        filter.createdAt = {}
        if (startDate) filter.createdAt.$gte = new Date(startDate)
        if (endDate) filter.createdAt.$lte = new Date(endDate)
      }

      // Tính toán pagination
      const skip = (page - 1) * limit

      // Lấy payments với populate orderId
      const payments = await Payment.find(filter)
        .populate('orderId', 'orderCode totalPrice status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

      // Đếm tổng số payments
      const totalPayments = await Payment.countDocuments(filter)
      const totalPages = Math.ceil(totalPayments / limit)

      return {
        payments,
        totalPayments,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    } catch (error) {
      throw new AppError(`Failed to get payments: ${error.message}`, 500)
    }
  }

  /**
   * Lấy payment theo ID
   */
  async getPaymentById(paymentId) {
    try {
      const payment = await Payment.findById(paymentId)
        .populate('orderId', 'orderCode totalPrice status userId')
        .populate('orderId.userId', 'name email')

      if (!payment) {
        throw new AppError('Payment not found', 404)
      }

      return payment
    } catch (error) {
      throw new AppError(`Failed to get payment: ${error.message}`, 500)
    }
  }

  /**
   * Lấy payment theo transactionCode
   */
  async getPaymentByTransactionCode(transactionCode) {
    try {
      const payment = await Payment.findByTransactionCode(transactionCode)
        .populate('orderId', 'orderCode totalPrice status userId')
        .populate('orderId.userId', 'name email')

      if (!payment) {
        throw new AppError('Payment not found', 404)
      }

      return payment
    } catch (error) {
      throw new AppError(`Failed to get payment: ${error.message}`, 500)
    }
  }

  /**
   * Tạo payment cho COD (Cash on Delivery)
   */
  async createCODPayment(orderId, amount, description) {
    try {
      const payment = new Payment({
        orderId,
        amount,
        method: 'cod',
        status: 'pending',
        description: description || 'Thanh toán khi nhận hàng (COD)'
      })

      await payment.save()

      return payment
    } catch (error) {
      throw new AppError(`Failed to create COD payment: ${error.message}`, 500)
    }
  }
}

export default new PaymentService()
