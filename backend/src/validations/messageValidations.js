import Joi from 'joi'

// Message validation schemas
export const messageValidations = {
  // Gửi tin nhắn
  sendMessage: Joi.object({
    receiverId: Joi.string()
      .required()
      .messages({
        'any.required': 'Receiver ID is required'
      }),
    content: Joi.string()
      .min(1)
      .max(1000)
      .required()
      .messages({
        'string.min': 'Message content cannot be empty',
        'string.max': 'Message content cannot be more than 1000 characters',
        'any.required': 'Message content is required'
      }),
    messageType: Joi.string()
      .valid('text', 'image', 'file', 'system')
      .default('text')
      .messages({
        'any.only': 'Message type must be one of: text, image, file, system'
      }),
    attachments: Joi.array()
      .items(
        Joi.object({
          filename: Joi.string().required(),
          originalName: Joi.string().required(),
          mimeType: Joi.string().required(),
          size: Joi.number().min(0).required(),
          url: Joi.string().uri().required()
        })
      )
      .max(5)
      .messages({
        'array.max': 'Cannot attach more than 5 files'
      })
  }),

  // Đánh dấu tin nhắn quan trọng
  markAsImportant: Joi.object({
    isImportant: Joi.boolean()
      .required()
      .messages({
        'any.required': 'isImportant field is required'
      })
  }),

  // Ghim tin nhắn
  pinMessage: Joi.object({
    isPinned: Joi.boolean()
      .required()
      .messages({
        'any.required': 'isPinned field is required'
      })
  }),

  // Tìm kiếm tin nhắn
  searchMessages: Joi.object({
    q: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Search query cannot be empty',
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
      .default(20)
      .messages({
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot be more than 100'
      }),
    conversationId: Joi.string()
      .optional()
      .messages({
        'string.base': 'Conversation ID must be a string'
      }),
    messageType: Joi.string()
      .valid('text', 'image', 'file', 'system')
      .optional()
      .messages({
        'any.only': 'Message type must be one of: text, image, file, system'
      }),
    dateFrom: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.format': 'Date from must be in ISO format'
      }),
    dateTo: Joi.date()
      .iso()
      .min(Joi.ref('dateFrom'))
      .optional()
      .messages({
        'date.format': 'Date to must be in ISO format',
        'date.min': 'Date to must be after date from'
      })
  }),

  // Lấy tin nhắn theo conversation
  getMessagesByConversation: Joi.object({
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
      .default(50)
      .messages({
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot be more than 100'
      }),
    sortBy: Joi.string()
      .valid('createdAt', 'updatedAt', 'content')
      .default('createdAt')
      .messages({
        'any.only': 'Sort by must be one of: createdAt, updatedAt, content'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be one of: asc, desc'
      })
  }),

  // Lấy conversation
  getConversations: Joi.object({
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
      .max(50)
      .default(20)
      .messages({
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot be more than 50'
      })
  }),

  // Lấy tin nhắn đã ghim
  getPinnedMessages: Joi.object({
    conversationId: Joi.string()
      .optional()
      .messages({
        'string.base': 'Conversation ID must be a string'
      })
  }),

  // Thống kê tin nhắn
  getMessageStatistics: Joi.object({
    dateFrom: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.format': 'Date from must be in ISO format'
      }),
    dateTo: Joi.date()
      .iso()
      .min(Joi.ref('dateFrom'))
      .optional()
      .messages({
        'date.format': 'Date to must be in ISO format',
        'date.min': 'Date to must be after date from'
      }),
    conversationId: Joi.string()
      .optional()
      .messages({
        'string.base': 'Conversation ID must be a string'
      }),
    senderId: Joi.string()
      .optional()
      .messages({
        'string.base': 'Sender ID must be a string'
      })
  }),

  // Upload file đính kèm
  uploadAttachment: Joi.object({
    // File validation sẽ được xử lý bởi multer middleware
    // Chỉ validate metadata
    attachment: Joi.object({
      fieldname: Joi.string().required(),
      originalname: Joi.string().required(),
      encoding: Joi.string().required(),
      mimetype: Joi.string()
        .valid(
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        .required()
        .messages({
          'any.only': 'File type not allowed. Allowed types: JPEG, PNG, GIF, WebP, PDF, TXT, DOC, DOCX'
        }),
      size: Joi.number()
        .max(10 * 1024 * 1024) // 10MB
        .required()
        .messages({
          'number.max': 'File size cannot exceed 10MB'
        })
    }).required()
  })
}

export default messageValidations
