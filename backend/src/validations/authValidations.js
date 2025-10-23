import Joi from 'joi'

// Auth validation schemas
export const authValidations = {
  // Register validation
  register: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot be more than 50 characters',
        'any.required': 'Name is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
        'any.required': 'Password is required'
      })
  }),

  // Login validation
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  // Send verification code validation
  sendVerificationCode: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot be more than 50 characters',
        'any.required': 'Name is required'
      })
  }),

  // Verify email code validation
  verifyEmailCode: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    code: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        'string.length': 'Verification code must be exactly 6 digits',
        'string.pattern.base': 'Verification code must contain only numbers',
        'any.required': 'Verification code is required'
      })
  }),

  // Register with verification validation
  registerWithVerification: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot be more than 50 characters',
        'any.required': 'Name is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
        'any.required': 'Password is required'
      }),
    verificationCode: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        'string.length': 'Verification code must be exactly 6 digits',
        'string.pattern.base': 'Verification code must contain only numbers',
        'any.required': 'Verification code is required'
      })
  }),

  // Forgot password validation
  forgotPassword: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      })
  }),

  // Reset password validation
  resetPassword: Joi.object({
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
        'any.required': 'Password is required'
      })
  }),

  // Change password validation
  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters',
        'string.pattern.base': 'New password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
        'any.required': 'New password is required'
      })
  }),

  // Update user validation
  updateUser: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot be more than 50 characters'
      }),
    email: Joi.string()
      .email()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    phone: Joi.string()
      .min(10)
      .max(20)
      .messages({
        'string.min': 'Phone number must be at least 10 characters',
        'string.max': 'Phone number cannot be more than 20 characters'
      }),
    address: Joi.string()
      .min(10)
      .max(200)
      .messages({
        'string.min': 'Address must be at least 10 characters',
        'string.max': 'Address cannot be more than 200 characters'
      })
  })
}

export default authValidations

