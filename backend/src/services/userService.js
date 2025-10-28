import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { config } from '~/config/environment'
import User from '~/models/userModel'
import { emailService } from '~/utils/sentMail'
import { AppError } from '~/utils/AppError'

/**
 * User Service - Xử lý business logic liên quan đến user
 * Theo Service-Based Architecture: Service chứa tất cả business logic
 */

// In-memory storage thay thế Redis
const memoryStorage = new Map()

class UserService {
  /**
   * Đăng ký user mới
   */
  async register(userData) {
    const { name, email, password, phone, address } = userData

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      throw new AppError('Email already exists', 400)
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 12)

    // Tạo user mới
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address
    })

    // Gửi email xác thực (background job)
    await this.sendVerificationEmail(user._id, email)

    // Tạo tokens
    const tokens = await this.generateTokens(user._id)

    return {
      user: this.sanitizeUser(user),
      ...tokens
    }
  }

  /**
   * Đăng nhập user
   */
  async login(credentials) {
    const { email, password } = credentials

    // Tìm user theo email
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      throw new AppError('Invalid email or password', 401)
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401)
    }

    // Kiểm tra trạng thái tài khoản
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401)
    }

    // Tạo tokens
    const tokens = await this.generateTokens(user._id)

    return {
      user: this.sanitizeUser(user),
      ...tokens
    }
  }

  /**
   * Đăng xuất user
   */
  async logout(refreshToken) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400)
    }

    // Xóa refresh token khỏi Redis
    memoryStorage.delete(`refresh_token:${refreshToken}`)

    return true
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400)
    }

    // Kiểm tra refresh token trong Redis
    const userId = memoryStorage.get(`refresh_token:${refreshToken}`)
    if (!userId) {
      throw new AppError('Invalid refresh token', 401)
    }

    // Tạo access token mới
    const accessToken = jwt.sign(
      { id: userId },
      config.jwtSecret,
      { expiresIn: '15m' }
    )

    return { accessToken }
  }

  /**
   * Lấy thông tin user theo ID
   */
  async getUserById(userId) {
    const user = await User.findById(userId)
    if (!user) {
      throw new AppError('User not found', 404)
    }

    return this.sanitizeUser(user)
  }

  /**
   * Cập nhật thông tin user
   */
  async updateUser(userId, updateData) {
    const allowedFields = ['name', 'phone', 'address', 'avatar']
    const filteredData = {}

    // Chỉ cho phép cập nhật các field được phép
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key]
      }
    })

    const user = await User.findByIdAndUpdate(
      userId,
      filteredData,
      { new: true, runValidators: true }
    )

    if (!user) {
      throw new AppError('User not found', 404)
    }

    return this.sanitizeUser(user)
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(userId, file) {
    const user = await User.findById(userId)
    if (!user) {
      throw new AppError('User not found', 404)
    }

    // Cập nhật avatar path
    const avatarPath = `/uploads/${file.filename}`
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarPath },
      { new: true, runValidators: true }
    )

    return this.sanitizeUser(updatedUser)
  }

  /**
   * Đổi mật khẩu
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password')
    if (!user) {
      throw new AppError('User not found', 404)
    }

    // Kiểm tra mật khẩu hiện tại
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400)
    }

    // Mã hóa mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Cập nhật mật khẩu
    user.password = hashedNewPassword
    await user.save()

    return true
  }

  /**
   * Quên mật khẩu
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email })
    if (!user) {
      throw new AppError('User not found', 404)
    }

    // Tạo reset token
    const resetToken = jwt.sign(
      { id: user._id, type: 'password_reset' },
      config.jwtSecret,
      { expiresIn: '1h' }
    )

    // Lưu reset token vào Redis
    memoryStorage.set(`password_reset:${resetToken}`, user._id)

    // Gửi email reset password (background job)
    await this.sendPasswordResetEmail(user.email, resetToken)

    return true
  }

  /**
   * Đặt lại mật khẩu
   */
  async resetPassword(token, newPassword) {
    // Kiểm tra reset token
    const userId = memoryStorage.get(`password_reset:${token}`)
    if (!userId) {
      throw new AppError('Invalid or expired reset token', 400)
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Cập nhật mật khẩu
    await User.findByIdAndUpdate(userId, { password: hashedPassword })

    // Xóa reset token
    memoryStorage.delete(`password_reset:${token}`)

    return true
  }

  /**
   * Xác thực email
   */
  async verifyEmail(token) {
    // Kiểm tra verification token
    const userId = memoryStorage.get(`email_verification:${token}`)
    if (!userId) {
      throw new AppError('Invalid or expired verification token', 400)
    }

    // Cập nhật trạng thái xác thực
    await User.findByIdAndUpdate(userId, { isEmailVerified: true })

    // Xóa verification token
    memoryStorage.delete(`email_verification:${token}`)

    return true
  }

  /**
   * Gửi lại email xác thực
   */
  async resendVerificationEmail(email) {
    const user = await User.findOne({ email })
    if (!user) {
      throw new AppError('User not found', 404)
    }

    if (user.isEmailVerified) {
      throw new AppError('Email already verified', 400)
    }

    // Gửi email xác thực
    await this.sendVerificationEmail(user._id, email)

    return true
  }

  /**
   * Lấy danh sách user (Admin)
   */
  async getUsers(filters) {
    const { page, limit, search, role } = filters
    const query = {}

    // Tìm kiếm theo tên hoặc email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    // Lọc theo role
    if (role) {
      query.roleId = role
    }

    // Tính toán pagination
    const skip = (page - 1) * limit

    // Lấy danh sách user
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Thêm thông tin orders và spending cho mỗi user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const Order = (await import('~/models/orderModel')).default
      
      // Đếm số đơn hàng của user
      const totalOrders = await Order.countDocuments({ userId: user._id })
      
      // Tính tổng chi tiêu của user
      const orders = await Order.find({ userId: user._id }).select('totalPrice')
      const totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
      
      return {
        ...this.sanitizeUser(user),
        totalOrders,
        totalSpent
      }
    }))

    // Đếm tổng số user
    const total = await User.countDocuments(query)

    return {
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Xóa user (Admin)
   */
  async deleteUser(userId) {
    const user = await User.findById(userId)
    if (!user) {
      throw new AppError('User not found', 404)
    }

    await User.findByIdAndDelete(userId)
    return true
  }

  /**
   * Tạo access token và refresh token
   */
  async generateTokens(userId) {
    // Tạo access token
    const accessToken = jwt.sign(
      { id: userId },
      config.jwtSecret,
      { expiresIn: '15m' }
    )

    // Tạo refresh token
    const refreshToken = jwt.sign(
      { id: userId, type: 'refresh' },
      config.jwtSecret,
      { expiresIn: '7d' }
    )

    // Lưu refresh token vào Redis
    memoryStorage.set(`refresh_token:${refreshToken}`, userId)

    return { accessToken, refreshToken }
  }

  /**
   * Gửi email xác thực
   */
  async sendVerificationEmail(userId, email) {
    // Tạo verification token
    const verificationToken = jwt.sign(
      { id: userId, type: 'email_verification' },
      config.jwtSecret,
      { expiresIn: '24h' }
    )

    // Lưu token vào Redis
    memoryStorage.set(`email_verification:${verificationToken}`, userId)

    // Gửi email (sẽ được xử lý bởi background job)
    // await emailService.sendVerificationEmail(email, verificationToken)
  }

  /**
   * Gửi email reset password
   */
  async sendPasswordResetEmail(email, resetToken) {
    // Gửi email (sẽ được xử lý bởi background job)
    // await emailService.sendPasswordResetEmail(email, resetToken)
  }

  /**
   * Làm sạch thông tin user (loại bỏ password và các field nhạy cảm)
   */
  sanitizeUser(user) {
    const userObj = user.toObject ? user.toObject() : user
    
    // Xóa các field nhạy cảm
    delete userObj.password
    delete userObj.resetPasswordToken
    delete userObj.resetPasswordExpire
    delete userObj.__v
    
    return userObj
  }

  /**
   * Cập nhật role của user (Admin only)
   */
  async updateUserRole(userId, roleId) {
    // Kiểm tra user tồn tại
    const user = await User.findById(userId)
    if (!user) {
      throw new AppError('User not found', 404)
    }

    // Kiểm tra role tồn tại
    const Role = await import('~/models/roleModel')
    const role = await Role.default.findById(roleId)
    if (!role) {
      throw new AppError('Role not found', 404)
    }

    // Cập nhật role
    user.roleId = roleId
    await user.save()

    // Populate role để trả về thông tin đầy đủ
    await user.populate('roleId', 'name description')

    return this.sanitizeUser(user)
  }
}

export default new UserService()
