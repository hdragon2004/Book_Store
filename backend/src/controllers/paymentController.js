import { StatusCodes } from 'http-status-codes'
import paymentService from '~/services/paymentService'
import orderService from '~/services/orderService'
import { asyncHandler } from '~/utils/asyncHandler'
import { ApiResponse } from '~/utils/ApiResponse'
import { AppError } from '~/utils/AppError'

/**
 * Payment Controller - Xử lý thanh toán
 */

class PaymentController {
  /**
   * Tạo URL thanh toán VNPay
   * POST /api/payments/vnpay
   */
  createVNPayPayment = asyncHandler(async (req, res) => {
    const { orderId, amount, orderDescription } = req.body
    const customerInfo = {
      ipAddress: req.ip || req.connection.remoteAddress
    }

    const paymentData = await paymentService.createVNPayPayment({
      orderId,
      amount,
      orderDescription,
      customerInfo
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, paymentData, 'VNPay payment URL created successfully').toJSON()
    )
  })

  /**
   * Tạo URL thanh toán Momo
   * POST /api/v1/payments/momo
   */
  createMomoPayment = asyncHandler(async (req, res) => {
    const { orderId, amount, orderDescription } = req.body
    const customerInfo = {
      ipAddress: req.ip || req.connection.remoteAddress
    }

    const paymentData = await paymentService.createMomoPayment({
      orderId,
      amount,
      orderDescription,
      customerInfo
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, paymentData, 'Momo payment URL created successfully').toJSON()
    )
  })

  /**
   * Xử lý callback từ VNPay
   * GET /api/v1/payments/vnpay/callback
   */
  handleVNPayCallback = asyncHandler(async (req, res) => {
    try {
      const verificationResult = await paymentService.verifyVNPayCallback(req.query)

      if (verificationResult.success) {
        // Cập nhật trạng thái đơn hàng thành "confirmed"
        await orderService.updateOrderStatus(
          verificationResult.orderId,
          'confirmed',
          `Payment successful via VNPay. Transaction ID: ${verificationResult.transactionId}`
        )

        // Redirect đến trang thành công
        return res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${verificationResult.orderId}`)
      } else {
        // Redirect đến trang thất bại
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=${encodeURIComponent(verificationResult.message)}`)
      }
    } catch (error) {
      console.error('VNPay callback error:', error)
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=${encodeURIComponent('Payment verification failed')}`)
    }
  })

  /**
   * Xử lý callback từ Momo
   * GET /api/v1/payments/momo/callback
   */
  handleMomoCallback = asyncHandler(async (req, res) => {
    try {
      const verificationResult = await paymentService.verifyMomoCallback(req.query)

      if (verificationResult.success) {
        // Cập nhật trạng thái đơn hàng thành "confirmed"
        await orderService.updateOrderStatus(
          verificationResult.orderId,
          'confirmed',
          `Payment successful via Momo. Transaction ID: ${verificationResult.transactionId}`
        )

        // Redirect đến trang thành công
        return res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${verificationResult.orderId}`)
      } else {
        // Redirect đến trang thất bại
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=${encodeURIComponent(verificationResult.message)}`)
      }
    } catch (error) {
      console.error('Momo callback error:', error)
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=${encodeURIComponent('Payment verification failed')}`)
    }
  })

  /**
   * Xử lý IPN (Instant Payment Notification) từ VNPay
   * POST /api/v1/payments/vnpay/ipn
   */
  handleVNPayIPN = asyncHandler(async (req, res) => {
    try {
      const verificationResult = await paymentService.verifyVNPayCallback(req.body)

      if (verificationResult.success) {
        // Cập nhật trạng thái đơn hàng
        await orderService.updateOrderStatus(
          verificationResult.orderId,
          'confirmed',
          `Payment confirmed via VNPay IPN. Transaction ID: ${verificationResult.transactionId}`
        )
      }

      // Trả về response cho VNPay
      res.status(StatusCodes.OK).json({
        RspCode: '00',
        Message: 'Success'
      })
    } catch (error) {
      console.error('VNPay IPN error:', error)
      res.status(StatusCodes.BAD_REQUEST).json({
        RspCode: '99',
        Message: 'Failed'
      })
    }
  })

  /**
   * Xử lý IPN từ Momo
   * POST /api/v1/payments/momo/ipn
   */
  handleMomoIPN = asyncHandler(async (req, res) => {
    try {
      const verificationResult = await paymentService.verifyMomoCallback(req.body)

      if (verificationResult.success) {
        // Cập nhật trạng thái đơn hàng
        await orderService.updateOrderStatus(
          verificationResult.orderId,
          'confirmed',
          `Payment confirmed via Momo IPN. Transaction ID: ${verificationResult.transactionId}`
        )
      }

      // Trả về response cho Momo
      res.status(StatusCodes.OK).json({
        resultCode: verificationResult.success ? '0' : '1',
        message: verificationResult.success ? 'Success' : 'Failed'
      })
    } catch (error) {
      console.error('Momo IPN error:', error)
      res.status(StatusCodes.BAD_REQUEST).json({
        resultCode: '1',
        message: 'Failed'
      })
    }
  })

  /**
   * Lấy danh sách phương thức thanh toán
   * GET /api/v1/payments/methods
   */
  getPaymentMethods = asyncHandler(async (req, res) => {
    const paymentMethods = [
      {
        id: 'cod',
        name: 'Thanh toán khi nhận hàng (COD)',
        description: 'Thanh toán bằng tiền mặt khi nhận hàng',
        icon: 'cash',
        enabled: true
      },
      {
        id: 'vnpay',
        name: 'VNPay',
        description: 'Thanh toán qua VNPay',
        icon: 'vnpay',
        enabled: true
      },
      {
        id: 'momo',
        name: 'Ví MoMo',
        description: 'Thanh toán qua ví MoMo',
        icon: 'momo',
        enabled: true
      },
      {
        id: 'bank_transfer',
        name: 'Chuyển khoản ngân hàng',
        description: 'Chuyển khoản trực tiếp vào tài khoản ngân hàng',
        icon: 'bank',
        enabled: true
      }
    ]

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, paymentMethods, 'Payment methods retrieved successfully').toJSON()
    )
  })

  /**
   * Lấy danh sách payments (Admin only)
   * GET /api/payments
   */
  getPayments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, method, startDate, endDate } = req.query

    const payments = await paymentService.getPayments({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      method,
      startDate,
      endDate
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, payments, 'Payments retrieved successfully').toJSON()
    )
  })

  /**
   * Lấy payment theo ID
   * GET /api/payments/:paymentId
   */
  getPaymentById = asyncHandler(async (req, res) => {
    const { paymentId } = req.params

    const payment = await paymentService.getPaymentById(paymentId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, payment, 'Payment retrieved successfully').toJSON()
    )
  })

  /**
   * Lấy payment theo transactionCode
   * GET /api/payments/transaction/:transactionCode
   */
  getPaymentByTransactionCode = asyncHandler(async (req, res) => {
    const { transactionCode } = req.params

    const payment = await paymentService.getPaymentByTransactionCode(transactionCode)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, payment, 'Payment retrieved successfully').toJSON()
    )
  })

  /**
   * Tạo payment cho COD
   * POST /api/payments/cod
   */
  createCODPayment = asyncHandler(async (req, res) => {
    const { orderId, amount, description } = req.body

    if (!orderId || !amount) {
      throw new AppError('OrderId and amount are required', 400)
    }

    const payment = await paymentService.createCODPayment(orderId, amount, description)

    res.status(StatusCodes.CREATED).json(
      new ApiResponse(StatusCodes.CREATED, payment, 'COD payment created successfully').toJSON()
    )
  })
}

export default new PaymentController()
