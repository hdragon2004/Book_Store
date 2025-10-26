import jwt from 'jsonwebtoken'
import { config } from '~/config/environment'
import { Book } from '~/models/bookModel'
import { Order } from '~/models/orderModel'
import { UserBook } from '~/models/userBookModel'
import { ApiResponse } from '~/utils/ApiResponse'
import { AppError } from '~/utils/AppError'
import { asyncHandler } from '~/utils/asyncHandler'
import path from 'path'
import fs from 'fs'

/**
 * Tạo token tạm thời cho download
 */
const generateDownloadToken = (bookId, userId, expiresIn = '10m') => {
  return jwt.sign(
    { bookId, userId, type: 'download' },
    config.JWT_SECRET,
    { expiresIn }
  )
}

/**
 * Xác thực download token
 */
const verifyDownloadToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET)
    if (decoded.type !== 'download') {
      throw new Error('Invalid token type')
    }
    return decoded
  } catch (error) {
    throw new Error('Invalid or expired download token')
  }
}

/**
 * Kiểm tra quyền sở hữu sách
 */
const checkBookOwnership = async (userId, bookId) => {
  // Kiểm tra trong UserBook (sách đã mua)
  const userBook = await UserBook.findOne({ userId, bookId })
  if (userBook) {
    return { owned: true, source: 'userBook', userBook }
  }

  // Kiểm tra trong Order (đơn hàng đã giao)
  const order = await Order.findOne({
    userId,
    'orderItems.bookId': bookId,
    status: { $in: ['delivered', 'digital_delivered'] }
  }).populate('orderItems.bookId')

  if (order) {
    return { owned: true, source: 'order', order }
  }

  return { owned: false }
}

/**
 * Kiểm tra giới hạn download
 */
const checkDownloadLimits = async (userId, bookId) => {
  const userBook = await UserBook.findOne({ userId, bookId })
  if (!userBook) {
    throw new AppError('Book not found in user library', 404)
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Đếm số lần download trong 7 ngày qua
  const recentDownloads = userBook.downloadHistory.filter(
    download => new Date(download.downloadedAt) > sevenDaysAgo
  )

  if (recentDownloads.length >= 3) {
    throw new AppError('Download limit exceeded. Maximum 3 downloads per 7 days.', 429)
  }

  return { canDownload: true, remainingDownloads: 3 - recentDownloads.length }
}

/**
 * Tạo link download tạm thời
 * GET /api/download/temp/:bookId
 */
export const createDownloadLink = asyncHandler(async (req, res) => {
  const { bookId } = req.params
  const userId = req.user._id

  // Kiểm tra sách tồn tại
  const book = await Book.findById(bookId)
  if (!book) {
    throw new AppError('Book not found', 404)
  }

  // Kiểm tra quyền sở hữu
  const ownership = await checkBookOwnership(userId, bookId)
  if (!ownership.owned) {
    throw new AppError('You do not own this book', 403)
  }

  // Kiểm tra giới hạn download
  await checkDownloadLimits(userId, bookId)

  // Tạo token tạm thời (10 phút)
  const downloadToken = generateDownloadToken(bookId, userId, '10m')

  res.json(
    new ApiResponse(200, {
      downloadUrl: `/api/download/file/${bookId}?token=${downloadToken}`,
      expiresIn: '10 minutes',
      book: {
        title: book.title,
        format: book.format,
        digitalFile: book.digitalFile
      }
    }, 'Download link created successfully').toJSON()
  )
})

/**
 * Download file thực tế
 * GET /api/download/file/:bookId?token=...
 */
export const downloadFile = asyncHandler(async (req, res) => {
  const { bookId } = req.params
  const { token } = req.query

  if (!token) {
    throw new AppError('Download token required', 400)
  }

  // Xác thực token
  const decoded = verifyDownloadToken(token)
  const userId = decoded.userId

  // Kiểm tra sách tồn tại
  const book = await Book.findById(bookId)
  if (!book) {
    throw new AppError('Book not found', 404)
  }

  // Kiểm tra quyền sở hữu
  const ownership = await checkBookOwnership(userId, bookId)
  if (!ownership.owned) {
    throw new AppError('You do not own this book', 403)
  }

  // Kiểm tra file tồn tại
  const filePath = path.join(process.cwd(), 'storage', 'books', 
    book.format === 'audiobook' ? 'audiobooks' : 'ebooks', 
    book.digitalFile.filePath
  )

  if (!fs.existsSync(filePath)) {
    throw new AppError('File not found on server', 404)
  }

  // Ghi log download
  try {
    await UserBook.incrementDownloadCount(userId, bookId)
    console.log(`📥 User ${userId} downloaded book ${bookId}`)
  } catch (error) {
    console.error('Failed to log download:', error)
  }

  // Trả về file
  const fileName = `${book.title}.${book.digitalFile.mimeType.split('/')[1]}`
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error('Download error:', err)
      if (!res.headersSent) {
        res.status(500).json(
          new ApiResponse(500, null, 'Download failed').toJSON()
        )
      }
    }
  })
})

/**
 * Lấy thông tin download của user
 * GET /api/download/info/:bookId
 */
export const getDownloadInfo = asyncHandler(async (req, res) => {
  const { bookId } = req.params
  const userId = req.user._id

  // Kiểm tra sách tồn tại
  const book = await Book.findById(bookId)
  if (!book) {
    throw new AppError('Book not found', 404)
  }

  // Kiểm tra quyền sở hữu
  const ownership = await checkBookOwnership(userId, bookId)
  if (!ownership.owned) {
    throw new AppError('You do not own this book', 403)
  }

  // Lấy thông tin download
  const userBook = await UserBook.findOne({ userId, bookId })
  const downloadStats = userBook ? userBook.getDownloadStats() : {
    totalDownloads: 0,
    lastDownloadAt: null,
    recentDownloads: 0
  }

  res.json(
    new ApiResponse(200, {
      book: {
        _id: book._id,
        title: book.title,
        format: book.format,
        digitalFile: book.digitalFile
      },
      downloadStats,
      canDownload: true
    }, 'Download info retrieved successfully').toJSON()
  )
})

/**
 * Stream file cho đọc online
 * GET /api/download/stream/:bookId?token=...
 */
export const streamFile = asyncHandler(async (req, res) => {
  const { bookId } = req.params
  const { token } = req.query

  if (!token) {
    throw new AppError('Stream token required', 400)
  }

  // Xác thực token
  const decoded = verifyDownloadToken(token)
  const userId = decoded.userId

  // Kiểm tra sách tồn tại
  const book = await Book.findById(bookId)
  if (!book) {
    throw new AppError('Book not found', 404)
  }

  // Kiểm tra quyền sở hữu
  const ownership = await checkBookOwnership(userId, bookId)
  if (!ownership.owned) {
    throw new AppError('You do not own this book', 403)
  }

  // Kiểm tra file tồn tại
  const filePath = path.join(process.cwd(), 'storage', 'books', 
    book.format === 'audiobook' ? 'audiobooks' : 'ebooks', 
    book.digitalFile.filePath
  )

  if (!fs.existsSync(filePath)) {
    throw new AppError('File not found on server', 404)
  }

  // Set headers cho streaming
  res.setHeader('Content-Type', book.digitalFile.mimeType)
  res.setHeader('Accept-Ranges', 'bytes')
  res.setHeader('Cache-Control', 'no-cache')

  // Stream file
  const fileStream = fs.createReadStream(filePath)
  fileStream.pipe(res)

  fileStream.on('error', (err) => {
    console.error('Stream error:', err)
    if (!res.headersSent) {
      res.status(500).json(
        new ApiResponse(500, null, 'Stream failed').toJSON()
      )
    }
  })
})