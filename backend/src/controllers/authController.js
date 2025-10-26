import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '~/models/userModel'
import Role from '~/models/roleModel'
import EmailVerification from '~/models/emailVerificationModel'
import PasswordReset from '~/models/passwordResetModel'
import { config } from '~/config/environment'
import { ApiResponse } from '~/utils/ApiResponse'
import { AppError } from '~/utils/AppError'
import { asyncHandler } from '~/utils/asyncHandler'
import { addVerificationEmailJob, addPasswordResetEmailJob, addWelcomeEmailJob, addOTPVerificationJob } from '~/queue/emailQueue'

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body

  // Check if user already exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new AppError('User already exists', 400)
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create user (unverified by default)
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    address,
    isEmailVerified: false
  })

  // Generate verification code
  const verificationCode = EmailVerification.generateCode()
  
  // Save verification code to database
  await EmailVerification.create({
    email: user.email,
    code: verificationCode
  })

  // Send verification email
  await addVerificationEmailJob(user.email, verificationCode)

  res.status(201).json(
    new ApiResponse(201, {
      message: 'User registered successfully. Please check your email for verification code.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        isEmailVerified: user.isEmailVerified
      }
    }, 'Registration successful. Email verification required.')
  )
})

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Find user by email with populated role
  const user = await User.findOne({ email }).select('+password').populate('roleId', 'name')
  
  if (!user) {
    throw new AppError('Invalid credentials', 401)
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password)
  
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401)
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  )

  // If user doesn't have a role, assign default 'user' role
  let userRole = user.roleId?.name || 'user'
  if (!user.roleId) {
    console.log('⚠️ User has no role, assigning default user role')
    // Find or create default user role
    let defaultRole = await Role.findOne({ name: 'user' })
    if (!defaultRole) {
      defaultRole = await Role.create({ name: 'user', description: 'Default user role' })
      console.log('✅ Created default user role')
    }
    // Update user with default role
    user.roleId = defaultRole._id
    await user.save()
    userRole = 'user'
    console.log('✅ Assigned default role to user')
  }

  // Tạo object user với tất cả thông tin
  const userData = user.toObject()
  delete userData.password
  delete userData.resetPasswordToken
  delete userData.resetPasswordExpire
  delete userData.__v
  
  const responseData = {
    user: {
      ...userData,
    },
    token
  }
  
  
  res.status(200).json(
    new ApiResponse(200, responseData, 'Login successful')
  )
})

/**
 * @desc    Get current user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('roleId', 'name')
  
  // Tạo object user với tất cả thông tin
  const userData = user.toObject()
  delete userData.password
  delete userData.resetPasswordToken
  delete userData.resetPasswordExpire
  delete userData.__v
  
  res.status(200).json(
    new ApiResponse(200, {
      user: {
        ...userData,
        id: userData._id,
        role: user.roleId?.name || 'user'
      }
    }, 'User profile retrieved successfully')
  )
})



/**
 * @desc    Change password
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user._id

  const user = await User.findById(userId).select('+password')
  
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400)
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10)
  user.password = hashedNewPassword
  await user.save()

  res.status(200).json(
    new ApiResponse(200, null, 'Password changed successfully')
  )
})

/**
 * @desc    Send verification code
 * @route   POST /api/v1/auth/send-verification-code
 * @access  Public
 */
export const sendVerificationCode = asyncHandler(async (req, res) => {
  const { email, name } = req.body

  // Send verification code request

  // Check if user already exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    console.log('👤 User exists:', existingUser.isEmailVerified ? 'verified' : 'not verified')
    if (existingUser.isEmailVerified) {
      throw new AppError('Email already verified', 400)
    }
    // User exists but not verified, delete old codes and send new code
    await EmailVerification.deleteMany({ email })
    // Deleted old verification codes for existing user
  } else {
    // User doesn't exist, this is for registration
    // Delete any existing verification codes for this email to allow resending
    await EmailVerification.deleteMany({ email })
  }

  // Generate new verification code
  const verificationCode = EmailVerification.generateCode()
  // Save verification code to database
  await EmailVerification.create({
    email: email.toLowerCase(),
    code: verificationCode
  })

  // Send verification email
  await addOTPVerificationJob(email, name || 'User', verificationCode)

  res.status(200).json(
    new ApiResponse(200, {
      message: 'Verification code sent to your email'
    }, 'Verification code sent successfully')
  )
})

/**
 * @desc    Verify email code
 * @route   POST /api/v1/auth/verify-email
 * @access  Public
 */
export const verifyEmailCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body

  // Verify code
  const result = await EmailVerification.verifyCode(email.toLowerCase(), code)
  
  if (!result.success) {
    throw new AppError(result.message, 400)
  }

  // Update user email verification status
  await User.findOneAndUpdate(
    { email },
    { isEmailVerified: true }
  )

  res.status(200).json(
    new ApiResponse(200, {
      message: 'Email verified successfully'
    }, 'Email verification successful')
  )
})

/**
 * @desc    Register with verification
 * @route   POST /api/v1/auth/register-with-verification
 * @access  Public
 */
export const registerWithVerification = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, verificationCode } = req.body

  // Register with verification request

  // Check if user already exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new AppError('User already exists', 400)
  }

  // Verify code first
  const result = await EmailVerification.verifyCode(email.toLowerCase(), verificationCode)
  // Verification result
  if (!result.success) {
    throw new AppError(result.message, 400)
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Find user role
  const userRole = await Role.findOne({ name: 'user' })
  if (!userRole) {
    throw new AppError('User role not found', 500)
  }

  // Create user (verified)
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    address,
    roleId: userRole._id,
    isEmailVerified: true
  })

  // Send welcome email - DISABLED
  // await addWelcomeEmailJob(user.email, user.name)

  res.status(201).json(
    new ApiResponse(201, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        isEmailVerified: user.isEmailVerified
      }
    }, 'User registered with verification successfully')
  )
})

/**
 * @desc    Send OTP for password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  // Check if user exists
  const user = await User.findOne({ email })
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Generate OTP code
  const otpCode = EmailVerification.generateCode()
  
  // Save OTP to database
  await EmailVerification.create({
    email: user.email,
    code: otpCode
  })

  // Send OTP email
  await addOTPVerificationJob(user.email, user.name, otpCode)

  res.status(200).json(
    new ApiResponse(200, {
      message: 'OTP code sent to your email for password reset',
      user: {
        name: user.name,
        email: user.email
      }
    }, 'OTP sent successfully')
  )
})

/**
 * @desc    Verify OTP for password reset
 * @route   POST /api/auth/verify-reset-otp
 * @access  Public
 */
export const verifyResetOTP = asyncHandler(async (req, res) => {
  const { email, code } = req.body

  // Verifying reset OTP

  // Find verification without marking as used
  const verification = await EmailVerification.findOne({
    email: email.toLowerCase(),
    code,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  })

  // Found verification

  if (!verification) {
    // Check if code exists but expired
    const expiredVerification = await EmailVerification.findOne({
      email: email.toLowerCase(),
      code
    })
    if (expiredVerification) {
      // Found expired verification
    }
    throw new AppError('Invalid or expired verification code', 400)
  }

  if (verification.attempts >= 3) {
    throw new AppError('Too many attempts. Please request a new code', 400)
  }

  res.status(200).json(
    new ApiResponse(200, {
      message: 'OTP verified successfully. You can now reset your password.'
    }, 'OTP verification successful')
  )
})

/**
 * @desc    Reset password with OTP verification
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password } = req.body

  // Reset password request

  // Find and verify OTP code
  const verification = await EmailVerification.findOne({
    email: email.toLowerCase(),
    code,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  })

  // Found verification for reset

  if (!verification) {
    // Check if code exists but expired
    const expiredVerification = await EmailVerification.findOne({
      email: email.toLowerCase(),
      code
    })
    if (expiredVerification) {
      // Found expired verification for reset
    }
    throw new AppError('Invalid or expired verification code', 400)
  }

  if (verification.attempts >= 3) {
    throw new AppError('Too many attempts. Please request a new code', 400)
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Update user password
  await User.findOneAndUpdate(
    { email },
    { password: hashedPassword }
  )

  // Mark OTP as used after successful password reset
  verification.isUsed = true
  await verification.save()


  res.status(200).json(
    new ApiResponse(200, {
      message: 'Password reset successfully'
    }, 'Password reset successful')
  )
})
