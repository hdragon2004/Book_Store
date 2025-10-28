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
      console.log(`📧 Processing email job: ${type}`, { data: JSON.stringify(data, null, 2) })

      switch (type) {
        case EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL:
          if (!data?.email || !data?.token) {
            console.error('❌ Missing email or token in verification job:', data)
            return
          }
          await emailService.sendVerificationEmail(data.email, data.token)
          break

        case EMAIL_JOB_TYPES.SEND_PASSWORD_RESET_EMAIL:
          if (!data?.email || !data?.token) {
            console.error('❌ Missing email or token in password reset job:', data)
            return
          }
          await emailService.sendPasswordResetEmail(data.email, data.token)
          break

        case EMAIL_JOB_TYPES.SEND_WELCOME_EMAIL:
          if (!data?.email || !data?.name) {
            console.error('❌ Missing email or name in welcome job:', data)
            return
          }
          await emailService.sendWelcomeEmail(data.email, data.name)
          break

        case EMAIL_JOB_TYPES.SEND_ORDER_CONFIRMATION:
          if (!data?.orderData) {
            console.error('❌ Missing orderData in order confirmation job:', data)
            return
          }
          if (!data.orderData?._id) {
            console.error('❌ Invalid orderData - missing _id:', data.orderData)
            return
          }
          if (!data.orderData?.userId) {
            console.error('❌ Invalid orderData - missing userId:', data.orderData)
            return
          }
          await emailService.sendOrderConfirmationEmail(data.orderData)
          break

        case EMAIL_JOB_TYPES.SEND_ORDER_STATUS_UPDATE:
          if (!data?.email || !data?.orderData || !data?.status) {
            console.error('❌ Missing email, orderData or status in order status update job:', data)
            return
          }
          await emailService.sendOrderStatusUpdate(data.email, data.orderData, data.status)
          break

        case EMAIL_JOB_TYPES.SEND_NEWSLETTER:
          if (!data?.subscribers || !data?.newsletterData) {
            console.error('❌ Missing subscribers or newsletterData in newsletter job:', data)
            return
          }
          await emailService.sendNewsletter(data.subscribers, data.newsletterData)
          break

        case EMAIL_JOB_TYPES.SEND_DIGITAL_BOOKS:
          if (!data?.to || !data?.userName || !data?.orderId || !data?.books) {
            console.error('❌ Missing required data in digital books job:', data)
            return
          }
          await emailService.sendDigitalBooks(data.to, data.userName, data.orderId, data.books)
          break

        case EMAIL_JOB_TYPES.SEND_OTP_VERIFICATION:
          if (!data?.email || !data?.userName || !data?.otpCode) {
            console.error('❌ Missing email, userName or otpCode in OTP verification job:', data)
            return
          }
          await emailService.sendOTPVerification(data.email, data.userName, data.otpCode)
          break

        default:
          throw new Error(`Unknown email job type: ${type}`)
      }

      console.log(`✅ Email job completed successfully: ${type}`)
    } catch (error) {
      console.error(`❌ Email job failed: ${type}`, error.message)
      console.error('❌ Job data:', JSON.stringify(data, null, 2))
      throw error
    }
  }
}

export default memoryQueue
