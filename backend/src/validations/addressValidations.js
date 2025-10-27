import Joi from 'joi'

// Address validation schemas
export const addressValidations = {
  // Create address validation
  createAddress: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Receiver name must be at least 2 characters',
        'string.max': 'Receiver name cannot be more than 100 characters',
        'any.required': 'Receiver name is required'
      }),
    phone: Joi.string()
      .pattern(/^(0[3|5|7|8|9])[0-9]{8}$|^(\+84[3|5|7|8|9])[0-9]{8}$|^84[3|5|7|8|9][0-9]{8}$/)
      .required()
      .messages({
        'string.pattern.base': 'Please enter a valid Vietnamese phone number (10-11 digits starting with 0 or +84)',
        'any.required': 'Phone number is required'
      }),
    address: Joi.string()
      .min(10)
      .max(200)
      .required()
      .messages({
        'string.min': 'Address must be at least 10 characters',
        'string.max': 'Address cannot be more than 200 characters',
        'any.required': 'Address is required'
      }),
    city: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'City must be at least 2 characters',
        'string.max': 'City name cannot be more than 50 characters',
        'any.required': 'City is required'
      }),
    district: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'District must be at least 2 characters',
        'string.max': 'District name cannot be more than 50 characters',
        'any.required': 'District is required'
      }),
    ward: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Ward must be at least 2 characters',
        'string.max': 'Ward name cannot be more than 50 characters',
        'any.required': 'Ward is required'
      }),
    isDefault: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'isDefault must be a boolean'
      })
  }),

  // Update address validation
  updateAddress: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .messages({
        'string.min': 'Receiver name must be at least 2 characters',
        'string.max': 'Receiver name cannot be more than 100 characters'
      }),
    phone: Joi.string()
      .pattern(/^(0[3|5|7|8|9])[0-9]{8}$|^(\+84[3|5|7|8|9])[0-9]{8}$|^84[3|5|7|8|9][0-9]{8}$/)
      .messages({
        'string.pattern.base': 'Please enter a valid Vietnamese phone number (10-11 digits starting with 0 or +84)'
      }),
    address: Joi.string()
      .min(10)
      .max(200)
      .messages({
        'string.min': 'Address must be at least 10 characters',
        'string.max': 'Address cannot be more than 200 characters'
      }),
    city: Joi.string()
      .min(2)
      .max(50)
      .messages({
        'string.min': 'City must be at least 2 characters',
        'string.max': 'City name cannot be more than 50 characters'
      }),
    district: Joi.string()
      .min(2)
      .max(50)
      .messages({
        'string.min': 'District must be at least 2 characters',
        'string.max': 'District name cannot be more than 50 characters'
      }),
    ward: Joi.string()
      .min(2)
      .max(50)
      .messages({
        'string.min': 'Ward must be at least 2 characters',
        'string.max': 'Ward name cannot be more than 50 characters'
      }),
    isDefault: Joi.boolean()
      .messages({
        'boolean.base': 'isDefault must be a boolean'
      })
  }),

  // Address ID validation
  addressId: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Address ID must be a valid MongoDB ObjectId',
        'any.required': 'Address ID is required'
      })
  })
}

export default addressValidations
