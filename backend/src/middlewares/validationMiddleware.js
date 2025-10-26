import { validationResult, body } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { ApiResponse } from '~/utils/ApiResponse'
import { messageValidations } from '~/validations/messageValidations'

/**
 * Validation Middleware - Xử lý kết quả validation từ express-validator
 * Trả về lỗi nếu validation không thành công
 */

export const validationMiddleware = (req, res, next) => {
  // Lấy kết quả validation
  const errors = validationResult(req)

  // Nếu có lỗi validation
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array())
    // Format lỗi thành object dễ đọc
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }))

    // Trả về response lỗi
    return res.status(StatusCodes.BAD_REQUEST).json(
      new ApiResponse(
        StatusCodes.BAD_REQUEST,
        {
          errors: formattedErrors,
          totalErrors: formattedErrors.length
        },
        'Validation failed',
        false
      )
    )
  }

  // Nếu không có lỗi, tiếp tục
  next()
}

/**
 * Validation Schemas - Định nghĩa các validation rules
 */
export const validationSchemas = {
  // Register validation
  register: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    
    body('phone')
      .optional()
      .trim()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    
    body('address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address must not exceed 200 characters')
  ],

  // Login validation
  login: [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  // Change password validation
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
  ],

  // Reset password validation
  resetPassword: [
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],

  // Send verification code validation
  sendVerificationCode: [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters')
  ],

  // Verify email code validation
  verifyEmailCode: [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email'),
    
    body('code')
      .notEmpty()
      .withMessage('Verification code is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be 6 digits')
  ],

  // Register with verification validation
  registerWithVerification: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    
    body('verificationCode')
      .notEmpty()
      .withMessage('Verification code is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be 6 digits'),
    
    body('phone')
      .optional()
      .trim()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    
    body('address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address must not exceed 200 characters')
  ]
}

/**
 * Message validation schemas
 */
export const validateMessage = {
  sendMessage: [
    body('toId')
      .notEmpty()
      .withMessage('Receiver ID is required'),
    
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Message content is required')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message content must be between 1 and 1000 characters'),
    
    body('attachments')
      .optional()
      .isArray({ max: 5 })
      .withMessage('Cannot attach more than 5 files')
  ],

  markAsImportant: [
    body('isImportant')
      .isBoolean()
      .withMessage('isImportant must be a boolean')
  ],

  pinMessage: [
    body('isPinned')
      .isBoolean()
      .withMessage('isPinned must be a boolean')
  ]
}

/**
 * Validate function - Wrapper cho validation middleware
 */
export const validate = (validationRules) => {
  return [validationRules, validationMiddleware]
}