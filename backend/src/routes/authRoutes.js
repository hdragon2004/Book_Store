import express from 'express'
import {
  register,
  login,
  getMe,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  changePassword,
  sendVerificationCode,
  verifyEmailCode,
  registerWithVerification
} from '~/controllers/authController'
import { authenticate } from '~/middlewares/authMiddleware'
import { validate, validationSchemas } from '~/middlewares/validationMiddleware'

const router = express.Router()

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', validate(validationSchemas.register), register)

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validate(validationSchemas.login), login)

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, getMe)

// @route   POST /api/auth/forgot-password
// @desc    Forgot password - Send OTP
// @access  Public
router.post('/forgot-password', forgotPassword)

// @route   POST /api/auth/verify-reset-otp
// @desc    Verify OTP for password reset
// @access  Public
router.post('/verify-reset-otp', verifyResetOTP)

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', validate(validationSchemas.resetPassword), resetPassword)

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', authenticate, validate(validationSchemas.changePassword), changePassword)

// @route   POST /api/auth/send-verification-code
// @desc    Send email verification code
// @access  Public
router.post('/send-verification-code', validate(validationSchemas.sendVerificationCode), sendVerificationCode)

// @route   POST /api/auth/verify-email
// @desc    Verify email code
// @access  Public
router.post('/verify-email', validate(validationSchemas.verifyEmailCode), verifyEmailCode)

// @route   POST /api/auth/register-with-verification
// @desc    Register user with email verification
// @access  Public
router.post('/register-with-verification', validate(validationSchemas.registerWithVerification), registerWithVerification)

// @route   POST /api/auth/test-email
// @desc    Test email sending
// @access  Public
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }

    // Import email service
    const { emailService } = await import('~/utils/sentMail')
    
    // Send test OTP
    await emailService.sendOTPVerification(email, 'Test User', '123456')
    
    res.json({ success: true, message: 'Test email sent successfully' })
  } catch (error) {
    console.error('Test email error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
