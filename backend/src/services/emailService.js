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
  const { orderCode, totalPrice, shippingAddress, orderItems, createdAt } = order
  
  const itemsHtml = orderItems.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <img src="${item.bookId.imageUrl || '/default-book.jpg'}" 
             alt="${item.bookId.title}" 
             style="width: 50px; height: 70px; object-fit: cover; margin-right: 10px; vertical-align: top;">
        <div style="display: inline-block; vertical-align: top;">
          <h4 style="margin: 0; color: #333;">${item.bookId.title}</h4>
          <p style="margin: 5px 0; color: #666;">Tác giả: ${item.bookId.author}</p>
          <p style="margin: 5px 0; color: #666;">Số lượng: ${item.quantity}</p>
          <p style="margin: 5px 0; color: #e74c3c; font-weight: bold;">Giá: ${item.priceAtPurchase.toLocaleString('vi-VN')} VND</p>
        </div>
      </td>
    </tr>
  `).join('')

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
          <p><strong>Ngày đặt:</strong> ${new Date(createdAt).toLocaleDateString('vi-VN')}</p>
          <p><strong>Tổng tiền:</strong> <span style="color: #e74c3c; font-size: 18px; font-weight: bold;">${totalPrice.toLocaleString('vi-VN')} VND</span></p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #34495e; margin-top: 0;">📦 Sản phẩm đã đặt</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
          </table>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #34495e; margin-top: 0;">🚚 Địa chỉ giao hàng</h3>
          <p><strong>Người nhận:</strong> ${shippingAddress.name}</p>
          <p><strong>Số điện thoại:</strong> ${shippingAddress.phone}</p>
          <p><strong>Địa chỉ:</strong> ${shippingAddress.address}, ${shippingAddress.ward}, ${shippingAddress.district}, ${shippingAddress.city}</p>
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
          <p><strong>Người nhận:</strong> ${shippingAddress.name}</p>
          <p><strong>Số điện thoại:</strong> ${shippingAddress.phone}</p>
          <p><strong>Địa chỉ:</strong> ${shippingAddress.address}, ${shippingAddress.ward}, ${shippingAddress.district}, ${shippingAddress.city}</p>
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
export const sendOrderConfirmationEmail = async (order) => {
  try {
    // Kiểm tra nếu không có email
    if (!order.userId || !order.userId.email) {
      console.log('⚠️ No email address found for user, skipping email')
      return
    }

    const transporter = createTransporter()
    
    const mailOptions = {
      from: `"BookStore" <${process.env.SMTP_USER}>`,
      to: order.userId.email,
      subject: `✅ Xác nhận đơn hàng #${order.orderCode} - BookStore`,
      html: createOrderConfirmationTemplate(order)
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Order confirmation email sent:', result.messageId)
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
    console.log('✅ Shipping notification email sent:', result.messageId)
    return result
  } catch (error) {
    console.error('❌ Failed to send shipping notification email:', error)
    throw error
  }
}
