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
  cron.schedule('*/2 * * * *', async () => { // Chạy mỗi 2 phút thay vì mỗi phút
    try {
      // Chỉ lấy 5 đơn hàng mỗi lần để tránh block
      const orders = await Order.find({
        status: { $in: ['pending', 'confirmed', 'shipped'] },
        isDeleted: false
      }).limit(5).lean() // Sử dụng lean() để tăng performance

      if (orders.length === 0) return

      // Cập nhật batch để tăng performance
      const bulkOps = []
      const now = new Date()

      for (const order of orders) {
        let nextStatus = null
        let updateData = { updatedAt: now }

        switch (order.status) {
          case 'pending':
            nextStatus = 'confirmed'
            updateData.confirmedAt = now
            break
          case 'confirmed':
            nextStatus = 'shipped'
            updateData.shippedAt = now
            break
          case 'shipped':
            nextStatus = 'delivered'
            updateData.deliveredAt = now
            updateData.paymentStatus = 'completed'
            break
          default:
            continue
        }

        if (nextStatus) {
          updateData.status = nextStatus
          bulkOps.push({
            updateOne: {
              filter: { _id: order._id },
              update: updateData
            }
          })
        }
      }

      if (bulkOps.length > 0) {
        await Order.bulkWrite(bulkOps)
      }
    } catch (err) {
      console.error('❌ [CRON ERROR] Lỗi cập nhật trạng thái đơn hàng:', err.message)
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Ho_Chi_Minh'
  })
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

  // console.log('🚀 [CRON] Order cancellation job đã được khởi động - chạy mỗi 5 phút')
}

/**
 * Job: Gửi email thông báo khi đơn hàng chuyển sang shipped
 */
export const startShippingNotificationJob = () => {
  cron.schedule('*/3 * * * *', async () => { // Chạy mỗi 3 phút thay vì mỗi phút
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000) // Tăng thời gian window
      
      const orders = await Order.find({
        status: 'shipped',
        shippedAt: { $gte: fiveMinutesAgo },
        isDeleted: false
      })
      .limit(3) // Chỉ xử lý 3 đơn hàng mỗi lần
      .populate('userId', 'name email')
      .populate('shippingAddressId')
      .populate('shippingProvider')

      if (orders.length === 0) return

      for (const order of orders) {
        try {
          // Query orderItems riêng biệt
          const orderItems = await OrderItem.find({ orderId: order._id })
            .populate('bookId', 'title author')
          
          // Thêm orderItems vào order object
          order.orderItems = orderItems

          // Import email service dynamically để tránh circular dependency
          const { sendShippingNotificationEmail } = await import('~/services/emailService')
          
          await sendShippingNotificationEmail(order)
        } catch (emailError) {
          console.error(`❌ Lỗi gửi email cho đơn hàng ${order.orderCode}:`, emailError.message)
        }
      }
    } catch (err) {
      console.error('❌ [CRON ERROR] Lỗi gửi thông báo giao hàng:', err.message)
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Ho_Chi_Minh'
  })
}

/**
 * Khởi động tất cả cron jobs
 */
export const startAllCronJobs = () => {
  // console.log('🚀 [CRON] Đang khởi động tất cả cron jobs...')
  
  startOrderStatusJob()
  startOrderCancellationJob()
  startShippingNotificationJob()
  
  // console.log('✅ [CRON] Tất cả cron jobs đã được khởi động thành công!')
}
