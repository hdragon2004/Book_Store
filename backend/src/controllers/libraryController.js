import UserBook from '~/models/userBookModel'
import Book from '~/models/bookModel'
import { AppError } from '~/utils/AppError'
import { ApiResponse } from '~/utils/ApiResponse'
import { asyncHandler } from '~/utils/asyncHandler'

/**
 * Library Controller - Xử lý thư viện của user
 */

// Lấy danh sách sách trong thư viện
export const getMyLibrary = asyncHandler(async (req, res) => {
  const userId = req.user._id
  const { bookType, page = 1, limit = 20 } = req.query

  const userBooks = await UserBook.getUserBooks(userId, bookType)
  
  // Phân trang
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedBooks = userBooks.slice(startIndex, endIndex)

  res.status(200).json(
    new ApiResponse(200, {
      books: paginatedBooks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(userBooks.length / limit),
        totalBooks: userBooks.length,
        hasNext: endIndex < userBooks.length,
        hasPrev: startIndex > 0
      }
    }, 'Library retrieved successfully')
  )
})

// Lấy thông tin chi tiết sách trong thư viện
export const getLibraryBook = asyncHandler(async (req, res) => {
  const { bookId } = req.params
  const userId = req.user._id

  const userBook = await UserBook.findOne({
    userId,
    bookId,
    isActive: true
  }).populate({
    path: 'bookId',
    select: 'title author description imageUrl format digitalFile categoryId',
    populate: {
      path: 'categoryId',
      select: 'name'
    }
  }).populate('orderId', 'orderCode status createdAt')

  if (!userBook) {
    throw new AppError('Book not found in your library', 404)
  }

  // Lấy thống kê tải
  const downloadStats = userBook.getDownloadStats()

  res.status(200).json(
    new ApiResponse(200, {
      book: userBook,
      downloadStats
    }, 'Library book retrieved successfully')
  )
})

// Lấy lịch sử tải
export const getDownloadHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id
  const { limit = 50 } = req.query

  const userBooks = await UserBook.find({ userId, isActive: true })
    .populate('bookId', 'title author imageUrl')
    .populate('orderId', 'orderCode status createdAt')
    .sort({ createdAt: -1 })

  // Lấy tất cả download history từ các userBooks
  const allDownloads = []
  userBooks.forEach(userBook => {
    const downloads = userBook.getDownloadHistory(limit)
    downloads.forEach(download => {
      allDownloads.push({
        ...download.toObject(),
        book: userBook.bookId,
        order: userBook.orderId
      })
    })
  })

  // Sắp xếp theo thời gian
  allDownloads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  res.status(200).json(
    new ApiResponse(200, {
      downloads: allDownloads.slice(0, limit)
    }, 'Download history retrieved successfully')
  )
})

// Lấy thống kê thư viện
export const getLibraryStats = asyncHandler(async (req, res) => {
  const userId = req.user._id

  const stats = await UserBook.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: '$bookType',
        count: { $sum: 1 },
        totalDownloads: { $sum: '$downloadCount' }
      }
    }
  ])

  const totalBooks = await UserBook.countDocuments({ userId, isActive: true })
  
  // Tính tổng downloads từ tất cả userBooks
  const userBooks = await UserBook.find({ userId, isActive: true })
  const totalDownloads = userBooks.reduce((total, userBook) => {
    return total + userBook.downloadHistory.length
  }, 0)

  res.status(200).json(
    new ApiResponse(200, {
      totalBooks,
      totalDownloads,
      byType: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          totalDownloads: stat.totalDownloads
        }
        return acc
      }, {})
    }, 'Library stats retrieved successfully')
  )
})

// Tìm kiếm trong thư viện
export const searchLibrary = asyncHandler(async (req, res) => {
  const userId = req.user._id
  const { q, bookType, page = 1, limit = 20 } = req.query

  if (!q) {
    throw new AppError('Search query is required', 400)
  }

  const searchQuery = {
    userId,
    isActive: true,
    $or: [
      { 'bookId.title': { $regex: q, $options: 'i' } },
      { 'bookId.author': { $regex: q, $options: 'i' } }
    ]
  }

  if (bookType) {
    searchQuery.bookType = bookType
  }

  const userBooks = await UserBook.find(searchQuery)
    .populate({
      path: 'bookId',
      select: 'title author price imageUrl description categoryId',
      populate: {
        path: 'categoryId',
        select: 'name'
      }
    })
    .populate('orderId', 'orderCode status createdAt')
    .sort({ createdAt: -1 })

  // Phân trang
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedBooks = userBooks.slice(startIndex, endIndex)

  res.status(200).json(
    new ApiResponse(200, {
      books: paginatedBooks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(userBooks.length / limit),
        totalBooks: userBooks.length,
        hasNext: endIndex < userBooks.length,
        hasPrev: startIndex > 0
      }
    }, 'Library search completed successfully')
  )
})
