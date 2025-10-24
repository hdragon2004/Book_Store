import memoryQueue from './memoryQueue'
import { emailService } from '~/utils/sentMail'

/**
 * Email Queue - Xử lý các job gửi email trong background
 * Sử dụng In-Memory Queue thay vì Redis
 */

/**
 * Email Job Types
 */
export const EMAIL_JOB_TYPES = {
  SEND_VERIFICATION_EMAIL: 'send_verification_email',
  SEND_PASSWORD_RESET_EMAIL: 'send_password_reset_email',
  SEND_WELCOME_EMAIL: 'send_welcome_email',
  SEND_ORDER_CONFIRMATION: 'send_order_confirmation',
  SEND_ORDER_STATUS_UPDATE: 'send_order_status_update',
  SEND_NEWSLETTER: 'send_newsletter',
  SEND_DIGITAL_BOOKS: 'send_digital_books',
  SEND_OTP_VERIFICATION: 'send_otp_verification'
}

/**
 * Thêm job gửi email xác thực
 */
export const addVerificationEmailJob = async (email, token) => {
  return memoryQueue.add(
    'send-email',
    { 
      type: EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL,
      data: { email, token }
    },
    {
      delay: 0,
      attempts: 3
    }
  )
}

/**
 * Thêm job gửi email reset password
 */
export const addPasswordResetEmailJob = async (email, token) => {
  return memoryQueue.add(
    'send-email',
    { 
      type: EMAIL_JOB_TYPES.SEND_PASSWORD_RESET_EMAIL,
      data: { email, token }
    },
    {
      delay: 0,
      attempts: 3
    }
  )
}

/**
 * Thêm job gửi email chào mừng
 */
export const addWelcomeEmailJob = async (email, name) => {
  return memoryQueue.add(
    'send-email',
    { 
      type: EMAIL_JOB_TYPES.SEND_WELCOME_EMAIL,
      data: { email, name }
    },
    {
      delay: 0,
      attempts: 3
    }
  )
}

/**
 * Thêm job gửi email xác nhận đơn hàng
 */
export const addOrderConfirmationJob = async (email, orderData) => {
  return memoryQueue.add(
    'send-email',
    { 
      type: EMAIL_JOB_TYPES.SEND_ORDER_CONFIRMATION,
      data: { email, orderData }
    },
    {
      delay: 0,
      attempts: 3
    }
  )
}


/**
 * Thêm job gửi newsletter
 */
export const addNewsletterJob = async (subscribers, newsletterData) => {
  return memoryQueue.add(
    'send-email',
    { 
      type: EMAIL_JOB_TYPES.SEND_NEWSLETTER,
      data: { subscribers, newsletterData }
    },
    {
      delay: 0,
      attempts: 3
    }
  )
}

/**
 * Thêm job gửi sách điện tử
 */
export const addDigitalBookEmailJob = async (data) => {
  return memoryQueue.add(
    'send-email',
    { 
      type: EMAIL_JOB_TYPES.SEND_DIGITAL_BOOKS,
      data: data
    },
    {
      delay: 0,
      attempts: 3
    }
  )
}

/**
 * Thêm job gửi OTP verification
 */
export const addOTPVerificationJob = async (email, userName, otpCode) => {
  return memoryQueue.add(
    'send-email',
    { 
      type: EMAIL_JOB_TYPES.SEND_OTP_VERIFICATION,
      data: { email, userName, otpCode }
    },
    {
      delay: 0,
      attempts: 3
    }
  )
}


/**
 * Thêm job gửi order status update
 */
export const addOrderStatusUpdateJob = async (email, orderData, newStatus) => {
  return memoryQueue.add(
    'send-email',
    { 
      type: EMAIL_JOB_TYPES.SEND_ORDER_STATUS_UPDATE,
      data: { email, orderData, newStatus }
    },
    {
      delay: 0,
      attempts: 3
    }
  )
}

/**
 * Email Worker - Xử lý các job trong queue
 */
export const emailWorker = {
  async processJob(jobData) {
    const { type, data } = jobData

    try {
      switch (type) {
        case EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL:
          await emailService.sendVerificationEmail(data.email, data.token)
          break

        case EMAIL_JOB_TYPES.SEND_PASSWORD_RESET_EMAIL:
          await emailService.sendPasswordResetEmail(data.email, data.token)
          break

        case EMAIL_JOB_TYPES.SEND_WELCOME_EMAIL:
          await emailService.sendWelcomeEmail(data.email, data.name)
          break

        case EMAIL_JOB_TYPES.SEND_ORDER_CONFIRMATION:
          await emailService.sendOrderConfirmation(data.email, data.orderData)
          break

        case EMAIL_JOB_TYPES.SEND_ORDER_STATUS_UPDATE:
          await emailService.sendOrderStatusUpdate(data.email, data.orderData, data.status)
          break

        case EMAIL_JOB_TYPES.SEND_NEWSLETTER:
          await emailService.sendNewsletter(data.subscribers, data.newsletterData)
          break

        case EMAIL_JOB_TYPES.SEND_DIGITAL_BOOKS:
          await emailService.sendDigitalBooks(data.to, data.userName, data.orderId, data.books)
          break

        case EMAIL_JOB_TYPES.SEND_OTP_VERIFICATION:
          await emailService.sendOTPVerification(data.email, data.userName, data.otpCode)
          break

        case EMAIL_JOB_TYPES.SEND_ORDER_CONFIRMATION:
          await emailService.sendOrderConfirmation(data.email, data.orderData)
          break

        case EMAIL_JOB_TYPES.SEND_ORDER_STATUS_UPDATE:
          await emailService.sendOrderStatusUpdate(data.email, data.orderData, data.newStatus)
          break

        default:
          throw new Error(`Unknown email job type: ${type}`)
      }

    } catch (error) {
      console.error(`❌ Email job failed: ${type}`, error.message)
      throw error
    }
  }
}

export default memoryQueue
