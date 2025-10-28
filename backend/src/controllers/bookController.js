import { StatusCodes } from 'http-status-codes'
import bookService from '~/services/bookService'
import { asyncHandler } from '~/utils/asyncHandler'
import { ApiResponse } from '~/utils/ApiResponse'

/**
 * Book Controller - Xử lý các request liên quan đến sách
 * Theo Service-Based Architecture: Controller chỉ xử lý request/response
 * Business logic được xử lý trong Service layer
 */

class BookController {
  /**
   * Tạo sách mới (Admin only)
   * POST /api/v1/books
   */
  createBook = asyncHandler(async (req, res) => {
    const bookData = req.body
    console.log('📥 Received book data:', bookData)

    // Xử lý digitalFile cho sách điện tử/sách nói
    if (bookData.format === 'ebook' || bookData.format === 'audiobook') {
      if (bookData.fileUrl && !bookData.digitalFile) {
        // Tạo digitalFile từ fileUrl
        const digitalFile = {
          filePath: bookData.fileUrl,
          fileSize: 0, // Sẽ được cập nhật khi upload file thực tế
          mimeType: bookData.format === 'ebook' ? 'application/pdf' : 'audio/mpeg'
        }
        
        // Copy file từ uploads sang storage an toàn
        try {
          const fs = require('fs')
          const path = require('path')
          
          const sourcePath = path.join(process.cwd(), 'uploads', bookData.fileUrl)
          const storageDir = path.join(process.cwd(), 'storage', 'books', 
            bookData.format === 'audiobook' ? 'audiobooks' : 'ebooks')
          const destPath = path.join(storageDir, bookData.fileUrl)
          
          // Tạo thư mục nếu chưa có
          if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true })
          }
          
          // Copy file
          if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, destPath)
            console.log(`📁 File copied to secure storage: ${destPath}`)
          }
        } catch (error) {
          console.error('Error copying file to secure storage:', error)
        }
        
        // Chỉ thêm duration cho audiobook
        if (bookData.format === 'audiobook') {
          digitalFile.duration = 3600 // 1 giờ mặc định
        }
        
        bookData.digitalFile = digitalFile
        
        // Xóa fileUrl vì đã chuyển vào digitalFile
        delete bookData.fileUrl
      }
    }

    // Gọi service để tạo sách
    const book = await bookService.createBook(bookData)

    res.status(StatusCodes.CREATED).json(
      new ApiResponse(StatusCodes.CREATED, book, 'Book created successfully')
    )
  })

  /**
   * Lấy danh sách sách
   * GET /api/v1/books
   */
  getBooks = asyncHandler(async (req, res) => {
    const {
      page,
      limit,
      search,
      category,
      author,
      minPrice,
      maxPrice,
      stock,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    // Nếu không có page/limit thì lấy hết (không phân trang)
    const pagination = page && limit ? {
      page: parseInt(page),
      limit: parseInt(limit)
    } : null

    // Gọi service để lấy danh sách sách
    const result = await bookService.getBooks({
      pagination,
      search,
      category,
      author,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      stock,
      sortBy,
      sortOrder
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Books retrieved successfully')
    )
  })

  /**
   * Lấy thông tin sách theo ID
   * GET /api/v1/books/:id
   */
  getBookById = asyncHandler(async (req, res) => {
    const { id } = req.params

    // Gọi service để lấy thông tin sách
    const book = await bookService.getBookById(id)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, book, 'Book retrieved successfully')
    )
  })

  /**
   * Cập nhật sách (Admin only)
   * PUT /api/v1/books/:id
   */
  updateBook = asyncHandler(async (req, res) => {
    const { id } = req.params
    const updateData = req.body

    // Gọi service để cập nhật sách
    const updatedBook = await bookService.updateBook(id, updateData)

    res.status(StatusCodes.OK).json(
      new ApiResponse(
        StatusCodes.OK,
        updatedBook,
        'Book updated successfully'
      )
    )
  })

  /**
   * Xóa sách (Admin only)
   * DELETE /api/v1/books/:id
   */
  deleteBook = asyncHandler(async (req, res) => {
    const { id } = req.params

    // Gọi service để xóa sách
    await bookService.deleteBook(id)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, null, 'Book deleted successfully')
    )
  })

  /**
   * Tìm kiếm sách
   * GET /api/v1/books/search
   */
  searchBooks = asyncHandler(async (req, res) => {
    const {
      q,
      page = 1,
      limit = 10,
      category,
      author,
      minPrice,
      maxPrice
    } = req.query

    // Gọi service để tìm kiếm sách
    const result = await bookService.searchBooks({
      query: q,
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      author,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Search results retrieved successfully')
    )
  })

  /**
   * Lấy sách bán chạy
   * GET /api/v1/books/bestsellers
   */
  getBestsellers = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query

    // Gọi service để lấy sách bán chạy
    const books = await bookService.getBestsellers(parseInt(limit))

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, books, 'Bestsellers retrieved successfully')
    )
  })

  /**
   * Lấy sách mới
   * GET /api/v1/books/new
   */
  getNewBooks = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query

    // Gọi service để lấy sách mới
    const books = await bookService.getNewBooks(parseInt(limit))

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, books, 'New books retrieved successfully')
    )
  })

  /**
   * Lấy sách theo danh mục
   * GET /api/v1/books/category/:categoryId
   */
  getBooksByCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    // Gọi service để lấy sách theo danh mục
    const result = await bookService.getBooksByCategory(categoryId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Books by category retrieved successfully')
    )
  })

  /**
   * Lấy sách theo tác giả
   * GET /api/v1/books/author/:author
   */
  getBooksByAuthor = asyncHandler(async (req, res) => {
    const { author } = req.params
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    // Gọi service để lấy sách theo tác giả
    const result = await bookService.getBooksByAuthor(author, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Books by author retrieved successfully')
    )
  })

  /**
   * Upload ảnh sách
   * POST /api/v1/books/:id/upload-image
   */
  uploadBookImage = asyncHandler(async (req, res) => {
    const { id } = req.params
    const imageFile = req.file

    if (!imageFile) {
      return res.status(StatusCodes.BAD_REQUEST).json(
        new ApiResponse(StatusCodes.BAD_REQUEST, null, 'No image file provided')
      )
    }

    // Gọi service để upload ảnh
    const result = await bookService.uploadBookImage(id, imageFile)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Book image uploaded successfully')
    )
  })

  /**
   * Cập nhật số lượng tồn kho
   * PUT /api/v1/books/:id/stock
   */
  updateStock = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { quantity, operation = 'set' } = req.body // operation: 'set', 'add', 'subtract'

    // Gọi service để cập nhật tồn kho
    const result = await bookService.updateStock(id, quantity, operation)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Stock updated successfully')
    )
  })

  /**
   * Lấy thống kê sách (Admin only)
   * GET /api/v1/books/statistics
   */
  getBookStatistics = asyncHandler(async (req, res) => {
    // Gọi service để lấy thống kê
    const statistics = await bookService.getBookStatistics()

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, statistics, 'Book statistics retrieved successfully')
    )
  })
}

export default new BookController()
