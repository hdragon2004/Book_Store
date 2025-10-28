import cron from 'node-cron'
import Order from '~/models/orderModel'
import OrderItem from '~/models/orderItemModel'

/**
 * Job: Tự động cập nhật trạng thái đơn hàng mỗi 1 phút
 * Logic mô phỏng: 
 * - pending -> confirmed -> shipped -> delivered
 * - Nếu đã cancelled hoặc digital_delivered thì bỏ qua
 */
export const startOrderStatusJob = () => {
  cron.schedule('* * * * *', async () => {
    // console.log('🕒 [CRON] Kiểm tra và cập nhật trạng thái đơn hàng...')

    try {
      const orders = await Order.find({
        status: { $in: ['pending', 'confirmed', 'shipped'] },
        isDeleted: false
      })

      // console.log(`📋 Tìm thấy ${orders.length} đơn hàng cần cập nhật`)

      for (const order of orders) {
        let nextStatus = null
        const now = new Date()

        switch (order.status) {
          case 'pending':
            nextStatus = 'confirmed'
            order.confirmedAt = now
            break
          case 'confirmed':
            nextStatus = 'shipped'
            order.shippedAt = now
            break
          case 'shipped':
            nextStatus = 'delivered'
            order.deliveredAt = now
            order.paymentStatus = 'completed'
            break
          default:
            break
        }

        if (nextStatus) {
          order.status = nextStatus
          order.updatedAt = now
          await order.save()
          // console.log(`✅ Đơn hàng ${order.orderCode} chuyển sang trạng thái: ${nextStatus}`)
        }
      }

      // if (orders.length === 0) {
      //   console.log('ℹ️ Không có đơn hàng nào cần cập nhật')
      // }

    } catch (err) {
      console.error('❌ [CRON ERROR] Lỗi cập nhật trạng thái đơn hàng:', err.message)
    }
  })

  // console.log('🚀 [CRON] Order status job đã được khởi động - chạy mỗi phút')
}

/**
 * Job: Tự động hủy đơn hàng pending quá lâu (sau 30 phút)
 */
export const startOrderCancellationJob = () => {
  cron.schedule('*/5 * * * *', async () => { // Chạy mỗi 5 phút
    // console.log('🕒 [CRON] Kiểm tra đơn hàng pending quá lâu...')

    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      
      const orders = await Order.find({
        status: 'pending',
        createdAt: { $lt: thirtyMinutesAgo },
        isDeleted: false
      })

      // console.log(`📋 Tìm thấy ${orders.length} đơn hàng pending quá lâu`)

      for (const order of orders) {
        order.status = 'cancelled'
        order.cancelledAt = new Date()
        order.updatedAt = new Date()
        order.paymentStatus = 'refunded'
        await order.save()
        // console.log(`❌ Đơn hàng ${order.orderCode} đã bị hủy tự động (pending quá lâu)`)
      }

      // if (orders.length === 0) {
      //   console.log('ℹ️ Không có đơn hàng nào cần hủy tự động')
      // }

    } catch (err) {
      console.error('❌ [CRON ERROR] Lỗi hủy đơn hàng tự động:', err.message)
    }
  })

  console.log('🚀 [CRON] Order cancellation job đã được khởi động - chạy mỗi 5 phút')
}

/**
 * Job: Gửi email thông báo khi đơn hàng chuyển sang shipped
 */
export const startShippingNotificationJob = () => {
  cron.schedule('* * * * *', async () => {
    // console.log('🕒 [CRON] Kiểm tra đơn hàng mới shipped để gửi thông báo...')

    try {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
      
      const orders = await Order.find({
        status: 'shipped',
        shippedAt: { $gte: oneMinuteAgo },
        isDeleted: false
      })
      .populate('userId', 'name email')
      .populate('shippingAddressId')
      .populate('shippingProvider')

      // console.log(`📋 Tìm thấy ${orders.length} đơn hàng mới shipped`)

      for (const order of orders) {
        // Query orderItems riêng biệt
        const orderItems = await OrderItem.find({ orderId: order._id })
          .populate('bookId', 'title author')
        
        // Thêm orderItems vào order object
        order.orderItems = orderItems

        // Import email service dynamically để tránh circular dependency
        const { sendShippingNotificationEmail } = await import('~/services/emailService')
        
        try {
          await sendShippingNotificationEmail(order)
          // console.log(`📧 Đã gửi email thông báo giao hàng cho đơn hàng ${order.orderCode}`)
        } catch (emailError) {
          console.error(`❌ Lỗi gửi email cho đơn hàng ${order.orderCode}:`, emailError.message)
        }
      }

      // if (orders.length === 0) {
      //   console.log('ℹ️ Không có đơn hàng nào cần gửi thông báo giao hàng')
      // }

    } catch (err) {
      console.error('❌ [CRON ERROR] Lỗi gửi thông báo giao hàng:', err.message)
    }
  })

  console.log('🚀 [CRON] Shipping notification job đã được khởi động - chạy mỗi phút')
}

/**
 * Khởi động tất cả cron jobs
 */
export const startAllCronJobs = () => {
  console.log('🚀 [CRON] Đang khởi động tất cả cron jobs...')
  
  startOrderStatusJob()
  startOrderCancellationJob()
  startShippingNotificationJob()
  
  console.log('✅ [CRON] Tất cả cron jobs đã được khởi động thành công!')
}
