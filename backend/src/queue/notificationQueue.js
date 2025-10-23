import memoryQueue from './memoryQueue'

/**
 * Notification Queue - Xử lý các job gửi thông báo trong background
 * Sử dụng In-Memory Queue thay vì Redis
 */

/**
 * Notification Job Types
 */
export const NOTIFICATION_JOB_TYPES = {
  SEND_PUSH_NOTIFICATION: 'send_push_notification',
  SEND_SMS_NOTIFICATION: 'send_sms_notification',
  SEND_EMAIL_NOTIFICATION: 'send_email_notification',
  SEND_IN_APP_NOTIFICATION: 'send_in_app_notification',
  SEND_ORDER_NOTIFICATION: 'send_order_notification',
  SEND_STOCK_ALERT: 'send_stock_alert'
}

/**
 * Thêm job gửi push notification
 */
export const addPushNotificationJob = async (userId, title, message, data = {}) => {
  return memoryQueue.add(
    'send-notification',
    { 
      type: NOTIFICATION_JOB_TYPES.SEND_PUSH_NOTIFICATION,
      data: { userId, title, message, data }
    },
    {
      delay: 0,
      attempts: 3
    }
  )
}

/**
 * Thêm job gửi SMS notification
 */
export const addSMSNotificationJob = async (phone, message) => {
  return memoryQueue.add(
    'send-notification',
    { 
      type: NOTIFICATION_JOB_TYPES.SEND_SMS_NOTIFICATION,
      data: { phone, message }
    },
    {
      delay: 0,
      attempts: 3
    }
  )
}

/**
 * Thêm job gửi email notification
 */
export const addEmailNotificationJob = async (email, subject, message, template = null) => {
  return memoryQueue.add(
    'send-notification',
    { 
      type: NOTIFICATION_JOB_TYPES.SEND_EMAIL_NOTIFICATION,
      data: { email, subject, message, template }
    },
    {
      delay: 0,
      attempts: 3
    }
  )
}

/**
 * Thêm job gửi in-app notification
 */
export const addInAppNotificationJob = async (userId, type, title, message, data = {}) => {
  return memoryQueue.add(
    'send-notification',
    { 
      type: NOTIFICATION_JOB_TYPES.SEND_IN_APP_NOTIFICATION,
      data: { userId, type, title, message, data }
    },
    {
      delay: 0,
      attempts: 3
    }
  )
}

/**
 * Thêm job gửi thông báo đơn hàng
 */
export const addOrderNotificationJob = async (userId, orderId, status, message) => {
  return memoryQueue.add(
    'send-notification',
    { 
      type: NOTIFICATION_JOB_TYPES.SEND_ORDER_NOTIFICATION,
      data: { userId, orderId, status, message }
    },
    {
      delay: 0,
      attempts: 3
    }
  )
}

/**
 * Thêm job gửi cảnh báo tồn kho
 */
export const addStockAlertJob = async (bookId, bookTitle, currentStock, minStock) => {
  return memoryQueue.add(
    'send-notification',
    { 
      type: NOTIFICATION_JOB_TYPES.SEND_STOCK_ALERT,
      data: { bookId, bookTitle, currentStock, minStock }
    },
    {
      delay: 0,
      attempts: 3
    }
  )
}

/**
 * Notification Worker - Xử lý các job trong queue
 */
export const notificationWorker = {
  async processJob(jobData) {
    const { type, data } = jobData

    try {
      switch (type) {
        case NOTIFICATION_JOB_TYPES.SEND_PUSH_NOTIFICATION:
          await sendPushNotification(data.userId, data.title, data.message, data.data)
          break

        case NOTIFICATION_JOB_TYPES.SEND_SMS_NOTIFICATION:
          await sendSMSNotification(data.phone, data.message)
          break

        case NOTIFICATION_JOB_TYPES.SEND_EMAIL_NOTIFICATION:
          await sendEmailNotification(data.email, data.subject, data.message, data.template)
          break

        case NOTIFICATION_JOB_TYPES.SEND_IN_APP_NOTIFICATION:
          await sendInAppNotification(data.userId, data.type, data.title, data.message, data.data)
          break

        case NOTIFICATION_JOB_TYPES.SEND_ORDER_NOTIFICATION:
          await sendOrderNotification(data.userId, data.orderId, data.status, data.message)
          break

        case NOTIFICATION_JOB_TYPES.SEND_STOCK_ALERT:
          await sendStockAlert(data.bookId, data.bookTitle, data.currentStock, data.minStock)
          break

        default:
          throw new Error(`Unknown notification job type: ${type}`)
      }

      console.log(`✅ Notification job completed: ${type}`)
    } catch (error) {
      console.error(`❌ Notification job failed: ${type}`, error)
      throw error
    }
  }
}

/**
 * Helper functions để gửi các loại notification
 */

// Gửi push notification
async function sendPushNotification(userId, title, message, data) {
  // Implement push notification logic
  console.log(`📱 Push notification sent to user ${userId}: ${title} - ${message}`)
}

// Gửi SMS notification
async function sendSMSNotification(phone, message) {
  // Implement SMS notification logic
  console.log(`📱 SMS sent to ${phone}: ${message}`)
}

// Gửi email notification
async function sendEmailNotification(email, subject, message, template) {
  // Implement email notification logic
  console.log(`📧 Email notification sent to ${email}: ${subject}`)
}

// Gửi in-app notification
async function sendInAppNotification(userId, type, title, message, data) {
  // Implement in-app notification logic
  console.log(`🔔 In-app notification sent to user ${userId}: ${title} - ${message}`)
}

// Gửi thông báo đơn hàng
async function sendOrderNotification(userId, orderId, status, message) {
  // Implement order notification logic
  console.log(`📦 Order notification sent to user ${userId} for order ${orderId}: ${message}`)
}

// Gửi cảnh báo tồn kho
async function sendStockAlert(bookId, bookTitle, currentStock, minStock) {
  // Implement stock alert logic
  console.log(`⚠️ Stock alert for book ${bookTitle} (ID: ${bookId}): ${currentStock} remaining (min: ${minStock})`)
}

export default memoryQueue
