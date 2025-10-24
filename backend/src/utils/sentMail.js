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
  sendOrderConfirmationEmail: async (user, order) => {
    const transporter = createTransporter()
    const template = loadTemplate('orderConfirmation')
    
    const html = template({
      userName: user.name,
      orderId: order._id,
      totalPrice: order.totalPrice,
      orderDate: order.createdAt
    })

    await transporter.sendMail({
      from: `"Bookstore Team" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Xác nhận đơn hàng #${order._id}`,
      html
    })
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
