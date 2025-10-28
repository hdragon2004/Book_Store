import jwt from 'jsonwebtoken'
import { config } from '~/config/environment'
import Book from '~/models/bookModel'
import Order from '~/models/orderModel'
import UserBook from '~/models/userBookModel'
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
    config.jwtSecret,
    { expiresIn }
  )
}

/**
 * Xác thực download token
 */
const verifyDownloadToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
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
 * Lấy file extension từ MIME type
 */
const getFileExtension = (mimeType) => {
  const mimeToExt = {
    'application/pdf': 'pdf',
    'application/epub+zip': 'epub',
    'application/x-mobipocket-ebook': 'mobi',
    'application/vnd.amazon.ebook': 'azw',
    'text/plain': 'txt',
    'application/rtf': 'rtf',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/aac': 'aac',
    'audio/flac': 'flac'
  }
  return mimeToExt[mimeType] || 'bin'
}

/**
 * Lấy danh sách format được hỗ trợ
 */
const getSupportedFormats = (bookFormat) => {
  if (bookFormat === 'audiobook') {
    return {
      primary: 'mp3',
      alternatives: ['m4a', 'wav', 'ogg'],
      description: 'Audio formats for offline listening'
    }
  } else if (bookFormat === 'ebook') {
    return {
      primary: 'pdf',
      alternatives: ['epub', 'mobi', 'txt'],
      description: 'E-book formats for offline reading'
    }
  }
  return {
    primary: 'pdf',
    alternatives: [],
    description: 'Digital format for offline access'
  }
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

  // Kiểm tra sách có file digital không
  if (!book.digitalFile || !book.digitalFile.filePath) {
    throw new AppError('This book does not have a digital version', 400)
  }

  // Kiểm tra quyền sở hữu
  const ownership = await checkBookOwnership(userId, bookId)
  if (!ownership.owned) {
    throw new AppError('You do not own this book', 403)
  }

  // Kiểm tra giới hạn download
  await checkDownloadLimits(userId, bookId)

  // Tạo token tạm thời (30 phút cho download)
  const downloadToken = generateDownloadToken(bookId, userId, '30m')
  
  // Tạo token cho streaming (2 giờ cho đọc online)
  const streamToken = generateDownloadToken(bookId, userId, '2h')

  // Xác định loại file và extension
  const fileExtension = getFileExtension(book.digitalFile.mimeType)
  const fileName = `${book.title.replace(/[^a-zA-Z0-9\s]/g, '')}.${fileExtension}`

  res.json(
    new ApiResponse(200, {
      downloadUrl: `/api/download/file/${bookId}?token=${downloadToken}`,
      streamUrl: `/api/download/stream/${bookId}?token=${streamToken}`,
      expiresIn: '30 minutes',
      streamExpiresIn: '2 hours',
      book: {
        _id: book._id,
        title: book.title,
        author: book.author,
        format: book.format,
        digitalFile: {
          fileName: book.digitalFile.fileName,
          fileSize: book.digitalFile.fileSize,
          mimeType: book.digitalFile.mimeType,
          duration: book.digitalFile.duration // Cho audiobook
        }
      },
      downloadInfo: {
        fileName,
        fileSize: book.digitalFile.fileSize,
        canReadOffline: true,
        supportedFormats: getSupportedFormats(book.format)
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

  // Tạo tên file an toàn
  const safeTitle = book.title.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_')
  const fileExtension = getFileExtension(book.digitalFile.mimeType)
  const fileName = `${safeTitle}.${fileExtension}`

  // Set headers cho download
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
  res.setHeader('Content-Type', book.digitalFile.mimeType)
  res.setHeader('Content-Length', book.digitalFile.fileSize)
  res.setHeader('Cache-Control', 'no-cache')

  // Trả về file
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error('Download error:', err)
      if (!res.headersSent) {
        res.status(500).json(
          new ApiResponse(500, null, 'Download failed').toJSON()
        )
      }
    } else {
      console.log(`✅ File downloaded successfully: ${fileName}`)
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

  console.log('🔍 Stream request:', { bookId, token: token ? 'present' : 'missing' })

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

/**
 * Lấy thông tin chi tiết cho offline reading
 * GET /api/download/offline-info/:bookId
 */
export const getOfflineInfo = asyncHandler(async (req, res) => {
  const { bookId } = req.params
  const userId = req.user._id

  // Kiểm tra sách tồn tại
  const book = await Book.findById(bookId)
  if (!book) {
    throw new AppError('Book not found', 404)
  }

  // Kiểm tra sách có file digital không
  if (!book.digitalFile || !book.digitalFile.filePath) {
    throw new AppError('This book does not have a digital version', 400)
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

  // Tạo token cho offline access (24 giờ)
  const offlineToken = generateDownloadToken(bookId, userId, '24h')

  res.json(
    new ApiResponse(200, {
      book: {
        _id: book._id,
        title: book.title,
        author: book.author,
        description: book.description,
        coverImage: book.coverImage,
        format: book.format,
        digitalFile: {
          fileName: book.digitalFile.fileName,
          fileSize: book.digitalFile.fileSize,
          mimeType: book.digitalFile.mimeType,
          duration: book.digitalFile.duration,
          filePath: book.digitalFile.filePath
        }
      },
      offlineAccess: {
        downloadUrl: `/api/download/file/${bookId}?token=${offlineToken}`,
        streamUrl: `/api/download/stream/${bookId}?token=${offlineToken}`,
        expiresIn: '24 hours',
        canReadOffline: true,
        supportedApps: getSupportedApps(book.format),
        instructions: getOfflineInstructions(book.format)
      },
      downloadStats,
      canDownload: true
    }, 'Offline reading info retrieved successfully').toJSON()
  )
})

/**
 * Lấy danh sách ứng dụng được hỗ trợ
 */
const getSupportedApps = (bookFormat) => {
  if (bookFormat === 'audiobook') {
    return {
      mobile: ['Audible', 'Apple Books', 'Google Play Books', 'VLC Media Player'],
      desktop: ['Audible', 'iTunes', 'VLC Media Player', 'Windows Media Player'],
      web: ['Chrome', 'Firefox', 'Safari', 'Edge']
    }
  } else if (bookFormat === 'ebook') {
    return {
      mobile: ['Apple Books', 'Google Play Books', 'Kindle', 'Adobe Digital Editions'],
      desktop: ['Adobe Digital Editions', 'Calibre', 'Kindle for PC', 'Apple Books'],
      web: ['Chrome', 'Firefox', 'Safari', 'Edge']
    }
  }
  return {
    mobile: ['Default PDF Reader', 'Adobe Acrobat Reader'],
    desktop: ['Adobe Acrobat Reader', 'Chrome', 'Firefox'],
    web: ['Chrome', 'Firefox', 'Safari', 'Edge']
  }
}

/**
 * Lấy hướng dẫn đọc offline
 */
const getOfflineInstructions = (bookFormat) => {
  if (bookFormat === 'audiobook') {
    return {
      title: 'Hướng dẫn nghe sách nói offline',
      steps: [
        '1. Tải file audio về thiết bị của bạn',
        '2. Mở file bằng ứng dụng nghe nhạc (VLC, Apple Music, v.v.)',
        '3. Có thể tạo playlist để nghe liên tục',
        '4. Sử dụng chức năng bookmark để đánh dấu vị trí đã nghe'
      ],
      tips: [
        'Tải về khi có WiFi để tiết kiệm dữ liệu',
        'Kiểm tra dung lượng trống trước khi tải',
        'Sao lưu file vào cloud storage để không mất dữ liệu'
      ]
    }
  } else if (bookFormat === 'ebook') {
    return {
      title: 'Hướng dẫn đọc sách điện tử offline',
      steps: [
        '1. Tải file sách về thiết bị của bạn',
        '2. Mở file bằng ứng dụng đọc sách (Adobe Reader, Apple Books, v.v.)',
        '3. Có thể đánh dấu trang và ghi chú',
        '4. Điều chỉnh font chữ và kích thước theo ý muốn'
      ],
      tips: [
        'Sử dụng chế độ ban đêm để bảo vệ mắt',
        'Tạo bookmark cho các trang quan trọng',
        'Sao lưu file vào cloud storage để đồng bộ giữa các thiết bị'
      ]
    }
  }
  return {
    title: 'Hướng dẫn đọc offline',
    steps: [
      '1. Tải file về thiết bị của bạn',
      '2. Mở file bằng ứng dụng phù hợp',
      '3. Tận hưởng việc đọc offline'
    ],
    tips: [
      'Đảm bảo có đủ dung lượng trống',
      'Sao lưu file quan trọng'
    ]
  }
}