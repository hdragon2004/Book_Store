import nodemailer from 'nodemailer'
import path from 'path'
import fs from 'fs'
import handlebars from 'handlebars'
import { config } from '~/config/environment'

// Email transporter configuration
const createTransporter = () => {
  // Check if SMTP credentials are configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP credentials not configured. Email sending will be disabled.')
    // SMTP credentials not configured
    return null
  }

  // SMTP credentials configured

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

// Load email template
const loadTemplate = (templateName) => {
  try {
    const templatePath = path.join(process.cwd(), 'src', 'templates', `${templateName}.html`)
    const templateSource = fs.readFileSync(templatePath, 'utf-8')
    return handlebars.compile(templateSource)
  } catch (error) {
    // Template not found, using simple text email
    return null
  }
}

// Send email functions
export const emailService = {
  // Send welcome email
  sendWelcomeEmail: async (user) => {
    const transporter = createTransporter()
    const template = loadTemplate('welcome')
    
    const html = template({
      userName: user.name,
      userEmail: user.email,
      loginUrl: `${config.host}:${config.port}/login`
    })

    await transporter.sendMail({
      from: `"Bookstore Team" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Chào mừng bạn đến với Bookstore!',
      html
    })
  },

  // Send password reset email
  sendPasswordResetEmail: async (user, resetToken) => {
    const transporter = createTransporter()
    const template = loadTemplate('passwordReset')
    
    const resetUrl = `${config.host}:${config.port}/reset-password/${resetToken}`
    const html = template({
      userName: user.name,
      resetUrl,
      expiryHours: 24
    })

    await transporter.sendMail({
      from: `"Bookstore Team" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Đặt lại mật khẩu - Bookstore',
      html
    })
  },

  // Send order confirmation email
  sendOrderConfirmationEmail: async (orderData) => {
    try {
      // console.log('📧 sendOrderConfirmationEmail called with:', orderData)
      
      if (!orderData) {
        console.error('❌ No orderData provided')
        return
      }
      
      if (!orderData._id) {
        console.error('❌ No orderId in orderData:', orderData)
        return
      }
      
      if (!orderData.userId) {
        console.error('❌ No userId in orderData:', orderData)
        return
      }

    const transporter = createTransporter()
      
      if (!transporter) {
        console.error('❌ SMTP transporter not available')
        return
      }

    const template = loadTemplate('orderConfirmation')
    
      let html
      if (template) {
        html = template({
          userName: orderData.userId.name,
          orderId: orderData._id,
          orderCode: orderData.orderCode,
          orderDate: new Date(orderData.createdAt).toLocaleDateString('vi-VN'),
          orderStatus: orderData.status,
          orderStatusText: orderData.status === 'pending' ? 'Chờ xử lý' : 
                          orderData.status === 'confirmed' ? 'Đã xác nhận' : 
                          orderData.status === 'shipped' ? 'Đang giao' : 
                          orderData.status === 'delivered' ? 'Đã giao' : 'Đã hủy',
          totalAmount: orderData.totalPrice?.toLocaleString('vi-VN') || '0',
          originalAmount: orderData.originalAmount?.toLocaleString('vi-VN') || '0',
          discountAmount: orderData.discountAmount?.toLocaleString('vi-VN') || '0',
          items: orderData.orderItems || [],
          shippingAddress: orderData.shippingAddressId || {}
        })
      } else {
        // Simple HTML email if template not found
        const itemsList = orderData.orderItems && orderData.orderItems.length > 0 
          ? orderData.orderItems.map(item => `
              <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <div style="display: flex; align-items: center;">
                  <img src="${item.bookId?.imageUrl ? (item.bookId.imageUrl.startsWith('http') ? item.bookId.imageUrl : `http://localhost:5000${item.bookId.imageUrl}`) : 'https://via.placeholder.com/50x70?text=📚'}" 
                       alt="${item.bookId?.title || 'Sách'}" 
                       style="width: 50px; height: 70px; object-fit: cover; margin-right: 15px; border-radius: 5px;">
                  <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #333; font-size: 16px;">${item.bookId?.title || 'Sách'}</h4>
                    <p style="margin: 2px 0; color: #666; font-size: 14px;"><strong>Tác giả:</strong> ${item.bookId?.author || 'N/A'}</p>
                    <p style="margin: 2px 0; color: #666; font-size: 14px;"><strong>Định dạng:</strong> ${item.bookId?.format || 'Sách giấy'}</p>
                    <p style="margin: 2px 0; color: #666; font-size: 14px;"><strong>Số lượng:</strong> ${item.quantity || 1}</p>
                    <p style="margin: 5px 0 0 0; color: #e74c3c; font-weight: bold; font-size: 16px;">Thành tiền: ${(item.quantity * item.priceAtPurchase).toLocaleString('vi-VN')} ₫</p>
                  </div>
                </div>
              </div>
            `).join('')
          : '<p style="color: #666; text-align: center; padding: 20px;">Không có sản phẩm nào</p>'

        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">📚 BookStore</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Cảm ơn bạn đã đặt hàng!</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #2c3e50; margin-bottom: 20px;">✅ Đơn hàng đã được xác nhận</h2>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="color: #34495e; margin-top: 0;">📋 Thông tin đơn hàng</h3>
                <p><strong>Mã đơn hàng:</strong> ${orderData.orderCode}</p>
                <p><strong>Ngày đặt:</strong> ${new Date(orderData.createdAt).toLocaleDateString('vi-VN')} lúc ${new Date(orderData.createdAt).toLocaleTimeString('vi-VN')}</p>
                <p><strong>Trạng thái:</strong> ${orderData.status === 'pending' ? 'Chờ xử lý' : orderData.status}</p>
                ${orderData.shippingProvider ? `<p><strong>Đơn vị giao hàng:</strong> ${orderData.shippingProvider.name || 'N/A'}</p>` : ''}
                ${orderData.shippingFee > 0 ? `<p><strong>Phí giao hàng:</strong> ${orderData.shippingFee.toLocaleString('vi-VN')} ₫</p>` : ''}
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 15px;">
                  <h4 style="margin: 0 0 10px 0; color: #2c3e50;">💰 Chi tiết thanh toán</h4>
                  ${orderData.originalAmount !== orderData.totalPrice ? `<p style="margin: 5px 0;"><strong>Tổng giá trị sản phẩm:</strong> ${orderData.originalAmount?.toLocaleString('vi-VN')} ₫</p>` : ''}
                  ${orderData.discountAmount > 0 ? `<p style="margin: 5px 0; color: #27ae60;"><strong>Giảm giá:</strong> -${orderData.discountAmount?.toLocaleString('vi-VN')} ₫</p>` : ''}
                  ${orderData.shippingFee > 0 ? `<p style="margin: 5px 0;"><strong>Phí giao hàng:</strong> ${orderData.shippingFee.toLocaleString('vi-VN')} ₫</p>` : ''}
                  <hr style="margin: 10px 0; border: none; border-top: 1px solid #ddd;">
                  <p style="margin: 5px 0; font-size: 18px;"><strong>Tổng thanh toán:</strong> <span style="color: #e74c3c; font-weight: bold;">${orderData.totalPrice?.toLocaleString('vi-VN')} ₫</span></p>
                </div>
              </div>

              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="color: #34495e; margin-top: 0;">📦 Sản phẩm đã đặt</h3>
                ${itemsList}
              </div>

              ${orderData.shippingAddressId ? `
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="color: #34495e; margin-top: 0;">🚚 Địa chỉ giao hàng</h3>
                <p><strong>Người nhận:</strong> ${orderData.shippingAddressId?.name || 'N/A'}</p>
                <p><strong>Số điện thoại:</strong> ${orderData.shippingAddressId?.phone || 'N/A'}</p>
                <p><strong>Địa chỉ:</strong> ${orderData.shippingAddressId?.address || 'N/A'}, ${orderData.shippingAddressId?.ward || 'N/A'}, ${orderData.shippingAddressId?.district || 'N/A'}, ${orderData.shippingAddressId?.city || 'N/A'}</p>
              </div>
              ` : ''}

              <div style="text-align: center; margin-top: 30px; padding: 20px; background: #e8f5e8; border-radius: 8px;">
                <p style="margin: 0; color: #27ae60; font-weight: bold;">🎉 Đơn hàng của bạn đang được xử lý!</p>
                <p style="margin: 10px 0 0 0; color: #666;">Chúng tôi sẽ gửi thông báo khi hàng được giao.</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
              <p>📧 Nếu có thắc mắc, vui lòng liên hệ: support@bookstore.com</p>
              <p>🌐 Truy cập website: <a href="http://localhost:3000" style="color: #3498db;">BookStore.com</a></p>
            </div>
          </div>
        `
      }

      const result = await transporter.sendMail({
        from: `"BookStore Team" <${process.env.SMTP_USER}>`,
        to: orderData.userId.email,
        subject: `✅ Xác nhận đơn hàng #${orderData.orderCode} - BookStore`,
      html
    })

      console.log('✅ Order confirmation email sent successfully to:', orderData.userId.email)
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error('❌ Order confirmation email failed:', error.message)
      throw new Error(`Failed to send order confirmation: ${error.message}`)
    }
  },

  // Send OTP verification code
  sendOTPVerification: async (email, userName, otpCode) => {
    try {
      // Sending OTP email
      
      const transporter = createTransporter()
      
      if (!transporter) {
        console.error('❌ SMTP transporter not available')
        throw new Error('SMTP credentials not configured')
      }

      const template = loadTemplate('otpVerification')
      
      let html
      if (template) {
        html = template({
          userName: userName,
          otpCode: otpCode,
          expiryMinutes: 5 // OTP expires in 5 minutes
        })
      } else {
        // Simple HTML email if template not found
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Xác thực OTP - BookStore</h2>
            <p>Xin chào <strong>${userName}</strong>,</p>
            <p>Mã OTP của bạn là: <strong style="font-size: 24px; color: #dc2626;">${otpCode}</strong></p>
            <p>Mã này có hiệu lực trong 5 phút.</p>
            <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
            <hr>
            <p style="color: #6b7280; font-size: 12px;">BookStore Team</p>
          </div>
        `
      }

      const result = await transporter.sendMail({
        from: `"BookStore Team" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Mã OTP xác thực - BookStore',
        html
      })

      // OTP email sent successfully
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error('❌ OTP email sending failed:', error.message)
      throw new Error(`Failed to send OTP email: ${error.message}`)
    }
  },

  // Send order confirmation email
  sendOrderConfirmation: async (email, orderData) => {
    try {
      const transporter = createTransporter()
      
      if (!transporter) {
        throw new Error('SMTP credentials not configured')
      }

      const template = loadTemplate('orderConfirmation')
      
      const html = template({
        userName: orderData.userName,
        orderId: orderData._id,
        orderDate: new Date(orderData.createdAt).toLocaleDateString('vi-VN'),
        orderStatus: orderData.status,
        orderStatusText: orderData.status === 'pending' ? 'Chờ xử lý' : 
                        orderData.status === 'confirmed' ? 'Đã xác nhận' : 
                        orderData.status === 'shipped' ? 'Đang giao' : 
                        orderData.status === 'delivered' ? 'Đã giao' : 'Đã hủy',
        totalAmount: orderData.totalPrice?.toLocaleString('vi-VN') || '0',
        items: orderData.items || [],
        shippingAddress: orderData.shippingAddress || {}
      })

      const result = await transporter.sendMail({
        from: `"BookStore Team" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Xác nhận đơn hàng #${orderData._id} - BookStore`,
        html
      })

      // Order confirmation email sent
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error('❌ Order confirmation email failed:', error.message)
      throw new Error(`Failed to send order confirmation: ${error.message}`)
    }
  },

  // Send order status update email
  sendOrderStatusUpdate: async (email, orderData, newStatus) => {
    try {
      const transporter = createTransporter()
      
      if (!transporter) {
        throw new Error('SMTP credentials not configured')
      }

      const template = loadTemplate('orderStatusUpdate')
      
      const statusTexts = {
        'pending': 'Chờ xử lý',
        'confirmed': 'Đã xác nhận', 
        'shipped': 'Đang giao',
        'delivered': 'Đã giao',
        'cancelled': 'Đã hủy'
      }

      const html = template({
        userName: orderData.userName,
        orderId: orderData._id,
        newStatus: newStatus,
        newStatusText: statusTexts[newStatus] || newStatus,
        updateTime: new Date().toLocaleString('vi-VN'),
        isShipped: newStatus === 'shipped',
        isDelivered: newStatus === 'delivered',
        shippingAddress: orderData.shippingAddress || {},
        estimatedDelivery: newStatus === 'shipped' ? '1-3 ngày làm việc' : null,
        deliveryTime: newStatus === 'delivered' ? new Date().toLocaleString('vi-VN') : null,
        trackingNumber: orderData.trackingNumber || null,
        note: orderData.note || null
      })

      const result = await transporter.sendMail({
        from: `"BookStore Team" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Cập nhật đơn hàng #${orderData._id} - BookStore`,
        html
      })

      // Order status update email sent
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error('❌ Order status update email failed:', error.message)
      throw new Error(`Failed to send order status update: ${error.message}`)
    }
  },

  /**
   * Gửi sách điện tử qua email
   */
  async sendDigitalBooks(to, userName, orderId, books) {
    try {
      if (!transporter) {
        // Email service not configured, skipping digital book delivery
        return
      }

      const subject = `📚 Sách điện tử của bạn - Đơn hàng #${orderId}`
      
      // Tạo danh sách sách
      const booksList = books.map(book => `
        <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;">
          <h3 style="color: #333; margin: 0 0 10px 0;">${book.title}</h3>
          <p style="margin: 5px 0;"><strong>Tác giả:</strong> ${book.author}</p>
          <p style="margin: 5px 0;"><strong>Định dạng:</strong> ${book.format}</p>
          <p style="margin: 5px 0;"><strong>Số lượng:</strong> ${book.quantity}</p>
          ${book.fileUrl ? `<p style="margin: 5px 0;"><strong>Link tải:</strong> <a href="${book.fileUrl}" style="color: #007bff;">Tải xuống</a></p>` : ''}
        </div>
      `).join('')

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">📚 Sách điện tử của bạn</h2>
          <p>Xin chào <strong>${userName}</strong>,</p>
          <p>Cảm ơn bạn đã mua sách tại BookStore! Dưới đây là các sách điện tử bạn đã mua:</p>
          
          ${booksList}
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0;">📋 Hướng dẫn sử dụng:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Nhấn vào link "Tải xuống" để tải sách về máy</li>
              <li>Lưu trữ sách ở nơi an toàn</li>
              <li>Liên hệ hỗ trợ nếu gặp vấn đề</li>
            </ul>
          </div>
          
          <p>Chúc bạn đọc sách vui vẻ!</p>
          <p>Trân trọng,<br>Đội ngũ BookStore</p>
        </div>
      `

      const mailOptions = {
        from: `"BookStore" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
      }

      await transporter.sendMail(mailOptions)
      // Digital books sent
      
    } catch (error) {
      console.error('❌ Digital book email sending failed:', error.message)
      throw new Error(`Failed to send digital books: ${error.message}`)
    }
  }
}
