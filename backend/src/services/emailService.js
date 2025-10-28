import nodemailer from 'nodemailer'
import config from '~/config/environment'

// Tạo transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

// Template cho email xác nhận đơn hàng
const createOrderConfirmationTemplate = (order) => {
  const { orderCode, totalPrice, shippingAddressId, orderItems = [], createdAt, paymentMethod, originalAmount, discountAmount } = order
  
  const itemsHtml = orderItems && orderItems.length > 0 ? orderItems.map(item => {
    const imageUrl = item.bookId?.imageUrl ? 
      (item.bookId.imageUrl.startsWith('http') ? item.bookId.imageUrl : `http://localhost:5000${item.bookId.imageUrl}`) : 
      'https://via.placeholder.com/50x70?text=📚'
    
    return `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: flex-start;">
          <img src="${imageUrl}" 
               alt="${item.bookId?.title || 'Sách'}" 
               style="width: 60px; height: 80px; object-fit: cover; margin-right: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="flex: 1;">
            <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${item.bookId?.title || 'Sách'}</h4>
            <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Tác giả:</strong> ${item.bookId?.author || 'N/A'}</p>
            <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Định dạng:</strong> ${item.bookId?.format || 'Sách giấy'}</p>
            <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Số lượng:</strong> ${item.quantity || 1}</p>
            <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Đơn giá:</strong> ${(item.priceAtPurchase || item.bookId?.price || 0).toLocaleString('vi-VN')} ₫</p>
            <p style="margin: 8px 0 0 0; color: #e74c3c; font-weight: bold; font-size: 16px;">Thành tiền: ${(item.total || 0).toLocaleString('vi-VN')} ₫</p>
          </div>
        </div>
      </td>
    </tr>
    `
  }).join('') : '<tr><td style="padding: 20px; text-align: center; color: #666;">Không có sản phẩm nào trong đơn hàng</td></tr>'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Xác nhận đơn hàng #${orderCode}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">📚 BookStore</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Cảm ơn bạn đã đặt hàng!</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">✅ Đơn hàng đã được xác nhận</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #34495e; margin-top: 0;">📋 Thông tin đơn hàng</h3>
          <p><strong>Mã đơn hàng:</strong> #${orderCode}</p>
          <p><strong>Ngày đặt:</strong> ${new Date(createdAt).toLocaleDateString('vi-VN')} lúc ${new Date(createdAt).toLocaleTimeString('vi-VN')}</p>
          <p><strong>Phương thức thanh toán:</strong> ${paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : paymentMethod === 'momo' ? 'Ví MoMo' : paymentMethod === 'vnpay' ? 'VNPay' : paymentMethod}</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <h4 style="margin: 0 0 10px 0; color: #2c3e50;">💰 Chi tiết thanh toán</h4>
            ${originalAmount !== totalPrice ? `<p style="margin: 5px 0;"><strong>Tổng giá trị sản phẩm:</strong> ${originalAmount.toLocaleString('vi-VN')} ₫</p>` : ''}
            ${discountAmount > 0 ? `<p style="margin: 5px 0; color: #27ae60;"><strong>Giảm giá:</strong> -${discountAmount.toLocaleString('vi-VN')} ₫</p>` : ''}
            <hr style="margin: 10px 0; border: none; border-top: 1px solid #ddd;">
            <p style="margin: 5px 0; font-size: 18px;"><strong>Tổng thanh toán:</strong> <span style="color: #e74c3c; font-weight: bold;">${totalPrice.toLocaleString('vi-VN')} ₫</span></p>
          </div>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #34495e; margin-top: 0;">📦 Sản phẩm đã đặt</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
          </table>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #34495e; margin-top: 0;">🚚 Địa chỉ giao hàng</h3>
          <p><strong>Người nhận:</strong> ${shippingAddressId?.name || 'N/A'}</p>
          <p><strong>Số điện thoại:</strong> ${shippingAddressId?.phone || 'N/A'}</p>
          <p><strong>Địa chỉ:</strong> ${shippingAddressId?.address || 'N/A'}, ${shippingAddressId?.ward || 'N/A'}, ${shippingAddressId?.district || 'N/A'}, ${shippingAddressId?.city || 'N/A'}</p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #e8f5e8; border-radius: 8px;">
          <p style="margin: 0; color: #27ae60; font-weight: bold;">🎉 Đơn hàng của bạn đang được xử lý!</p>
          <p style="margin: 10px 0 0 0; color: #666;">Chúng tôi sẽ gửi thông báo khi hàng được giao.</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
        <p>📧 Nếu có thắc mắc, vui lòng liên hệ: support@bookstore.com</p>
        <p>🌐 Truy cập website: <a href="http://localhost:3000" style="color: #3498db;">BookStore.com</a></p>
      </div>
    </body>
    </html>
  `
}

// Template cho email thông báo giao hàng
const createShippingNotificationTemplate = (order) => {
  const { orderCode, shippingAddress, orderItems } = order
  
  const itemsList = orderItems.map(item => 
    `• ${item.bookId.title} - ${item.quantity} cuốn`
  ).join('\n')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Hàng đang được giao - Đơn hàng #${orderCode}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🚚 BookStore</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Hàng đang được giao!</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">📦 Đơn hàng đang được giao</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #34495e; margin-top: 0;">📋 Thông tin đơn hàng</h3>
          <p><strong>Mã đơn hàng:</strong> #${orderCode}</p>
          <p><strong>Trạng thái:</strong> <span style="color: #f39c12; font-weight: bold;">Đang giao hàng</span></p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #34495e; margin-top: 0;">📚 Sản phẩm</h3>
          <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${itemsList}</pre>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #34495e; margin-top: 0;">🚚 Địa chỉ giao hàng</h3>
          <p><strong>Người nhận:</strong> ${shippingAddressId?.name || 'N/A'}</p>
          <p><strong>Số điện thoại:</strong> ${shippingAddressId?.phone || 'N/A'}</p>
          <p><strong>Địa chỉ:</strong> ${shippingAddressId?.address || 'N/A'}, ${shippingAddressId?.ward || 'N/A'}, ${shippingAddressId?.district || 'N/A'}, ${shippingAddressId?.city || 'N/A'}</p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404; font-weight: bold;">⚠️ Vui lòng chuẩn bị nhận hàng!</p>
          <p style="margin: 10px 0 0 0; color: #856404;">Đơn hàng sẽ được giao trong 1-3 ngày làm việc.</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
        <p>📧 Nếu có thắc mắc, vui lòng liên hệ: support@bookstore.com</p>
        <p>🌐 Truy cập website: <a href="http://localhost:3000" style="color: #3498db;">BookStore.com</a></p>
      </div>
    </body>
    </html>
  `
}

// Gửi email xác nhận đơn hàng
export const sendOrderConfirmationEmail = async (orderData) => {
  try {
    console.log('📧 Email service received orderData:', orderData)
    console.log('📧 OrderData type:', typeof orderData)
    console.log('📧 OrderData._id:', orderData?._id)
    
    if (!orderData) {
      console.log('❌ No orderData provided')
      return
    }
    
    // Kiểm tra nếu không có email
    if (!orderData?.userId || !orderData?.userId?.email) {
      console.log('❌ No userId or email in orderData')
      return
    }

    // Lấy orderId - đảm bảo có ID
    const orderId = orderData._id?.toString() || orderData._id
    
    if (!orderId) {
      console.log('❌ No orderId found')
      return
    }

    console.log('📧 Processing email for orderId:', orderId)
    console.log('📧 Order items count:', orderData.orderItems?.length || 0)

    const transporter = createTransporter()
    
    const mailOptions = {
      from: `"BookStore" <${process.env.SMTP_USER}>`,
      to: orderData.userId.email,
      subject: `✅ Xác nhận đơn hàng #${orderData.orderCode} - BookStore`,
      html: createOrderConfirmationTemplate(orderData)
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Order confirmation email sent successfully to:', orderData.userId.email)
    return result
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error)
    throw error
  }
}

// Gửi email thông báo giao hàng
export const sendShippingNotificationEmail = async (order) => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: `"BookStore" <${process.env.SMTP_USER}>`,
      to: order.userId.email,
      subject: `🚚 Hàng đang được giao - Đơn hàng #${order.orderCode} - BookStore`,
      html: createShippingNotificationTemplate(order)
    }

    const result = await transporter.sendMail(mailOptions)
    return result
  } catch (error) {
    console.error('❌ Failed to send shipping notification email:', error)
    throw error
  }
}

// Export các functions
export {
  sendOrderStatusUpdate,
  sendWelcomeEmail,
  sendNewsletter,
  sendDigitalBooks,
  sendOTPVerification,
  sendPasswordReset,
  sendShippingNotification
}
