import Joi from 'joi'

// Order validation schemas
export const orderValidations = {
  // Create order validation
  createOrder: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          bookId: Joi.string()
            .required()
            .messages({
              'any.required': 'Book ID is required'
            }),
          quantity: Joi.number()
            .integer()
            .min(1)
            .required()
            .messages({
              'number.integer': 'Quantity must be an integer',
              'number.min': 'Quantity must be at least 1',
              'any.required': 'Quantity is required'
            })
        })
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'Order must contain at least one item',
        'any.required': 'Items are required'
      }),
    shippingAddress: Joi.object({
      fullName: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
          'string.min': 'Full name must be at least 2 characters',
          'string.max': 'Full name cannot be more than 100 characters',
          'any.required': 'Full name is required'
        }),
      phone: Joi.string()
        .min(10)
        .max(20)
        .required()
        .messages({
          'string.min': 'Phone number must be at least 10 characters',
          'string.max': 'Phone number cannot be more than 20 characters',
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
          'string.max': 'City cannot be more than 50 characters',
          'any.required': 'City is required'
        }),
      postalCode: Joi.string()
        .min(5)
        .max(10)
        .required()
        .messages({
          'string.min': 'Postal code must be at least 5 characters',
          'string.max': 'Postal code cannot be more than 10 characters',
          'any.required': 'Postal code is required'
        })
    })
      .required()
      .messages({
        'any.required': 'Shipping address is required'
      }),
    paymentMethod: Joi.string()
      .valid('cod', 'credit_card', 'paypal', 'bank_transfer')
      .default('cod')
      .messages({
        'any.only': 'Payment method must be one of: cod, credit_card, paypal, bank_transfer'
      }),
    notes: Joi.string()
      .max(500)
      .allow('')
      .messages({
        'string.max': 'Notes cannot be more than 500 characters'
      })
  }),

  // Order query validation
  orderQuery: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot be more than 100'
      }),
    status: Joi.string()
      .valid('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')
      .allow('')
      .messages({
        'any.only': 'Status must be one of: pending, confirmed, shipped, delivered, cancelled'
      }),
    startDate: Joi.date()
      .iso()
      .allow('')
      .messages({
        'date.format': 'Start date must be in ISO format'
      }),
    endDate: Joi.date()
      .iso()
      .allow('')
      .messages({
        'date.format': 'End date must be in ISO format'
      })
  }),

  // Order ID validation
  orderId: Joi.object({
    id: Joi.string()
      .required()
      .messages({
        'any.required': 'Order ID is required'
      })
  }),

  // Update order status validation
  updateOrderStatus: Joi.object({
    status: Joi.string()
      .valid('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')
      .required()
      .messages({
        'any.only': 'Status must be one of: pending, confirmed, shipped, delivered, cancelled',
        'any.required': 'Status is required'
      })
  }),

  // Order item validation
  orderItem: Joi.object({
    bookId: Joi.string()
      .required()
      .messages({
        'any.required': 'Book ID is required'
      }),
    quantity: Joi.number()
      .integer()
      .min(1)
      .required()
      .messages({
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 1',
        'any.required': 'Quantity is required'
      }),
    price: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.min': 'Price must be at least 0',
        'any.required': 'Price is required'
      })
  }),

  // Order statistics validation
  orderStats: Joi.object({
    startDate: Joi.date()
      .iso()
      .allow('')
      .messages({
        'date.format': 'Start date must be in ISO format'
      }),
    endDate: Joi.date()
      .iso()
      .allow('')
      .messages({
        'date.format': 'End date must be in ISO format'
      }),
    groupBy: Joi.string()
      .valid('day', 'week', 'month', 'year')
      .default('month')
      .messages({
        'any.only': 'Group by must be one of: day, week, month, year'
      })
  })
}

export default orderValidations









