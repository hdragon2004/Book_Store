import Joi from 'joi'

// Book validation schemas
export const bookValidations = {
  // Create book validation
  createBook: Joi.object({
    title: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.min': 'Title must be at least 3 characters',
        'string.max': 'Title cannot be more than 100 characters',
        'any.required': 'Title is required'
      }),
    author: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.min': 'Author must be at least 3 characters',
        'string.max': 'Author cannot be more than 100 characters',
        'any.required': 'Author is required'
      }),
    description: Joi.string()
      .min(10)
      .max(1000)
      .required()
      .messages({
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description cannot be more than 1000 characters',
        'any.required': 'Description is required'
      }),
    price: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.min': 'Price must be at least 0',
        'any.required': 'Price is required'
      }),
    stock: Joi.number()
      .integer()
      .min(0)
      .required()
      .messages({
        'number.integer': 'Stock must be an integer',
        'number.min': 'Stock must be at least 0',
        'any.required': 'Stock is required'
      }),
    category: Joi.string()
      .required()
      .messages({
        'any.required': 'Category is required'
      }),
    imageUrl: Joi.string()
      .uri()
      .allow('')
      .messages({
        'string.uri': 'Image URL must be a valid URL'
      })
  }),

  // Update book validation
  updateBook: Joi.object({
    title: Joi.string()
      .min(3)
      .max(100)
      .messages({
        'string.min': 'Title must be at least 3 characters',
        'string.max': 'Title cannot be more than 100 characters'
      }),
    author: Joi.string()
      .min(3)
      .max(100)
      .messages({
        'string.min': 'Author must be at least 3 characters',
        'string.max': 'Author cannot be more than 100 characters'
      }),
    description: Joi.string()
      .min(10)
      .max(1000)
      .messages({
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description cannot be more than 1000 characters'
      }),
    price: Joi.number()
      .min(0)
      .messages({
        'number.min': 'Price must be at least 0'
      }),
    stock: Joi.number()
      .integer()
      .min(0)
      .messages({
        'number.integer': 'Stock must be an integer',
        'number.min': 'Stock must be at least 0'
      }),
    category: Joi.string()
      .messages({
        'string.base': 'Category must be a string'
      }),
    imageUrl: Joi.string()
      .uri()
      .allow('')
      .messages({
        'string.uri': 'Image URL must be a valid URL'
      })
  }),

  // Book query validation
  bookQuery: Joi.object({
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
    search: Joi.string()
      .max(100)
      .allow('')
      .messages({
        'string.max': 'Search term cannot be more than 100 characters'
      }),
    category: Joi.string()
      .allow('')
      .messages({
        'string.base': 'Category must be a string'
      }),
    minPrice: Joi.number()
      .min(0)
      .messages({
        'number.min': 'Minimum price must be at least 0'
      }),
    maxPrice: Joi.number()
      .min(0)
      .messages({
        'number.min': 'Maximum price must be at least 0'
      }),
    sortBy: Joi.string()
      .valid('title', 'author', 'price', 'createdAt')
      .default('createdAt')
      .messages({
        'any.only': 'Sort by must be one of: title, author, price, createdAt'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be either asc or desc'
      })
  }),

  // Book ID validation
  bookId: Joi.object({
    id: Joi.string()
      .required()
      .messages({
        'any.required': 'Book ID is required'
      })
  }),

  // Search validation
  searchBooks: Joi.object({
    q: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Search query must be at least 1 character',
        'string.max': 'Search query cannot be more than 100 characters',
        'any.required': 'Search query is required'
      }),
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
      })
  }),

  // Update stock validation
  updateStock: Joi.object({
    quantity: Joi.number()
      .integer()
      .min(1)
      .required()
      .messages({
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 1',
        'any.required': 'Quantity is required'
      }),
    operation: Joi.string()
      .valid('increase', 'decrease')
      .default('decrease')
      .messages({
        'any.only': 'Operation must be either increase or decrease'
      })
  })
}

export default bookValidations



