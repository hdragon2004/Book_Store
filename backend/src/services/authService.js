import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { StatusCodes } from 'http-status-codes'
import User from '~/models/userModel'
import EmailVerification from '~/models/emailVerificationModel'
import { emailService } from '~/utils/sentMail'
import { queueUtils } from '~/jobs/queue'
import { config } from '~/config/environment'
import crypto from 'crypto'

class AuthService {
  // Generate JWT Token
  generateToken(userId) {
    return jwt.sign({ id: userId }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    })
  }

  // Register user
  async register(userData) {
    try {
      const { name, email, password } = userData

      // Check if user exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        throw new Error('User already exists with this email')
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        emailVerified: false
      })

      // Generate verification code
      const verificationCode = EmailVerification.generateCode()

      // Delete any existing verification codes for this email
      await EmailVerification.deleteMany({ email })

      // Create new verification record
      await EmailVerification.create({
        email: email.toLowerCase(),
        code: verificationCode
      })

      // Send verification email via queue
      await queueUtils.addEmailJob('send-verification-email', {
        email,
        userName: name,
        verificationCode
      })

      return {
        success: true,
        message: 'User registered successfully. Please verify your email.',
        data: {
          userId: user._id,
          email: user.email,
          emailVerified: user.emailVerified
        }
      }
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`)
    }
  }

  // Login user
  async login(credentials) {
    try {
      const { email, password } = credentials

      // Find user with password
      const user = await User.findOne({ email }).select('+password')
      if (!user || user.isDeleted) {
        throw new Error('Invalid credentials')
      }

      // Check password
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        throw new Error('Invalid credentials')
      }

      // Generate token
      const token = this.generateToken(user._id)

      // Update last login
      user.lastLogin = new Date()
      await user.save()

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            roleId: user.roleId,
            emailVerified: user.emailVerified
          },
          token
        }
      }
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`)
    }
  }

  // Send verification code
  async sendVerificationCode(email, name) {
    try {
      // Check if email already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        throw new Error('Email already registered')
      }

      // Generate verification code
      const verificationCode = EmailVerification.generateCode()

      // Delete any existing verification codes for this email
      await EmailVerification.deleteMany({ email })

      // Create new verification record
      await EmailVerification.create({
        email: email.toLowerCase(),
        code: verificationCode
      })

      // Send verification email via queue
      await queueUtils.addEmailJob('send-verification-email', {
        email,
        userName: name,
        verificationCode
      })

      return {
        success: true,
        message: 'Verification code sent to your email',
        data: {
          email,
          expiresIn: 10 // minutes
        }
      }
    } catch (error) {
      throw new Error(`Send verification code failed: ${error.message}`)
    }
  }

  // Verify email code
  async verifyEmailCode(email, code) {
    try {
      // Verify the code
      const result = await EmailVerification.verifyCode(email.toLowerCase(), code)
      
      if (!result.success) {
        throw new Error(result.message)
      }

      return {
        success: true,
        message: 'Email verified successfully',
        data: {
          email,
          verified: true
        }
      }
    } catch (error) {
      throw new Error(`Email verification failed: ${error.message}`)
    }
  }

  // Register with verification
  async registerWithVerification(userData) {
    try {
      const { name, email, password, verificationCode } = userData

      // Verify the code first
      const verificationResult = await EmailVerification.verifyCode(email.toLowerCase(), verificationCode)
      
      if (!verificationResult.success) {
        throw new Error(verificationResult.message)
      }

      // Check if user already exists
      const userExists = await User.findOne({ email })
      if (userExists) {
        throw new Error('User already exists with this email')
      }

      // Create user with verified email
      const user = await User.create({
        name,
        email,
        password,
        emailVerified: true
      })

      // Generate token
      const token = this.generateToken(user._id)

      // Send welcome email via queue
      await queueUtils.addEmailJob('send-welcome-email', {
        email: user.email,
        userName: user.name
      })

      return {
        success: true,
        message: 'Registration completed successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            roleId: user.roleId,
            emailVerified: user.emailVerified
          },
          token
        }
      }
    } catch (error) {
      throw new Error(`Registration with verification failed: ${error.message}`)
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email })
      if (!user) {
        throw new Error('User not found with this email')
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpire = Date.now() + 10 * 60 * 1000 // 10 minutes

      user.resetPasswordToken = resetToken
      user.resetPasswordExpire = resetTokenExpire
      await user.save()

      // Send password reset email via queue
      await queueUtils.addEmailJob('send-password-reset-email', {
        email: user.email,
        userName: user.name,
        resetToken
      })

      return {
        success: true,
        message: 'Password reset email sent'
      }
    } catch (error) {
      throw new Error(`Forgot password failed: ${error.message}`)
    }
  }

  // Reset password
  async resetPassword(token, password) {
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() }
      })

      if (!user) {
        throw new Error('Invalid or expired token')
      }

      user.password = password
      user.resetPasswordToken = undefined
      user.resetPasswordExpire = undefined
      await user.save()

      return {
        success: true,
        message: 'Password reset successful'
      }
    } catch (error) {
      throw new Error(`Reset password failed: ${error.message}`)
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password')
      if (!user) {
        throw new Error('User not found')
      }

      // Check current password
      const isMatch = await user.comparePassword(currentPassword)
      if (!isMatch) {
        throw new Error('Current password is incorrect')
      }

      user.password = newPassword
      await user.save()

      return {
        success: true,
        message: 'Password changed successfully'
      }
    } catch (error) {
      throw new Error(`Change password failed: ${error.message}`)
    }
  }

  // Get current user
  async getCurrentUser(userId) {
    try {
      const user = await User.findById(userId).select('-password')
      if (!user) {
        throw new Error('User not found')
      }

      return {
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            roleId: user.roleId,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt
          }
        }
      }
    } catch (error) {
      throw new Error(`Get current user failed: ${error.message}`)
    }
  }
}

export default new AuthService()

