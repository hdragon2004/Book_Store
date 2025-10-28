import Book from '~/models/bookModel'
import Category from '~/models/categoryModel'
import OrderItem from '~/models/orderItemModel'
import { AppError } from '~/utils/AppError' 

/**
 * Book Service - Xử lý business logic liên quan đến sách
 * Theo Service-Based Architecture: Service chứa tất cả business logic
 */

class BookService {
  /**
   * Tạo sách mới
   */
  async createBook(bookData) {
    // Kiểm tra category tồn tại
    if (bookData.categoryId) {
      const category = await Category.findById(bookData.categoryId)
      if (!category) {
        throw new AppError('Category not found', 404)
      }
    }

    // Tạo sách mới
    const book = await Book.create(bookData)

    // Xóa cache liên quan
    await this.clearBookCache()

    return book
  }

  /**
   * Lấy danh sách sách
   */
  async getBooks(filters) {
    const {
      pagination,
      search,
      category,
      author,
      minPrice,
      maxPrice,
      stock,
      sortBy,
      sortOrder
    } = filters

    // Xây dựng query
    const query = { isActive: true }

    // Tìm kiếm theo tên, tác giả, mô tả
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // Lọc theo category (có thể là tên hoặc ObjectId)
    if (category) {
      // Kiểm tra xem category có phải là ObjectId hợp lệ không
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(category)
      
      let categoryDoc
      if (isObjectId) {
        // Nếu là ObjectId, tìm theo _id
        categoryDoc = await Category.findById(category)
      } else {
        // Nếu là string, tìm theo tên
        categoryDoc = await Category.findOne({
          name: { $regex: category, $options: 'i' }
        })
      }
      
      if (categoryDoc) {
        query.categoryId = categoryDoc._id
      } else {
        // Nếu không tìm thấy category, trả về kết quả rỗng
        query.categoryId = null
      }
    }

    // Lọc theo tác giả
    if (author) {
      query.author = { $regex: author, $options: 'i' }
    }

    // Lọc theo giá
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {}
      if (minPrice !== undefined) query.price.$gte = minPrice
      if (maxPrice !== undefined) query.price.$lte = maxPrice
    }

    // Lọc theo stock
    if (stock === 'inStock') {
      query.stock = { $gt: 0 }
    } else if (stock === 'outOfStock') {
      query.stock = { $lte: 0 }
    }

    // Xây dựng sort
    const sort = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Lấy danh sách sách
    let booksQuery = Book.find(query)
      .populate('categoryId')
      .sort(sort)

    // Nếu có pagination thì áp dụng skip/limit
    if (pagination) {
      const { page, limit } = pagination
      const skip = (page - 1) * limit
      booksQuery = booksQuery.skip(skip).limit(limit)
    }

    const books = await booksQuery

    // Nếu có pagination thì trả về thông tin pagination
    if (pagination) {
      const total = await Book.countDocuments(query)
      return {
        books,
        pagination: {
          currentPage: pagination.page,
          totalPages: Math.ceil(total / pagination.limit),
          totalBooks: total,
          limit: pagination.limit
        }
      }
    }

    // Nếu không có pagination thì chỉ trả về books
    return { books }
  }

  /**
   * Lấy thông tin sách theo ID
   */
  async getBookById(bookId) {
    const book = await Book.findById(bookId)
      .populate('categoryId')

    if (!book) {
      throw new AppError('Book not found', 404)
    }

    // Tăng view count
    await Book.findByIdAndUpdate(bookId, { $inc: { viewCount: 1 } })

    return book
  }

  /**
   * Cập nhật sách
   */
  async updateBook(bookId, updateData) {
    // Kiểm tra category nếu có
    if (updateData.categoryId) {
      const category = await Category.findById(updateData.categoryId)
      if (!category) {
        throw new AppError('Category not found', 404)
      }
    }

    const book = await Book.findByIdAndUpdate(
      bookId,
      updateData,
      { new: true, runValidators: true }
    )

    if (!book) {
      throw new AppError('Book not found', 404)
    }

    // Xóa cache liên quan
    await this.clearBookCache()

    return book
  }

  /**
   * Xóa sách
   */
  async deleteBook(bookId) {
    const book = await Book.findById(bookId)
    if (!book) {
      throw new AppError('Book not found', 404)
    }

    // Kiểm tra xem sách có trong đơn hàng nào không
    const orderItems = await OrderItem.find({ bookId })
    if (orderItems.length > 0) {
      throw new AppError('Cannot delete book that has been ordered', 400)
    }

    await Book.findByIdAndDelete(bookId)

    // Xóa cache liên quan
    await this.clearBookCache()

    return true
  }

  /**
   * Tìm kiếm sách
   */
  async searchBooks(filters) {
    const { query, page, limit, category, author, minPrice, maxPrice } = filters

    // Xây dựng search query
    const searchQuery = {
      isActive: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { isbn: { $regex: query, $options: 'i' } }
      ]
    }

    // Thêm filters
    if (category) {
      // Kiểm tra xem category có phải là ObjectId hợp lệ không
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(category)
      
      let categoryDoc
      if (isObjectId) {
        // Nếu là ObjectId, tìm theo _id
        categoryDoc = await Category.findById(category)
      } else {
        // Nếu là string, tìm theo tên
        categoryDoc = await Category.findOne({
          name: { $regex: category, $options: 'i' }
        })
      }
      
      if (categoryDoc) {
        searchQuery.categoryId = categoryDoc._id
      } else {
        // Nếu không tìm thấy category, trả về kết quả rỗng
        searchQuery.categoryId = null
      }
    }
    if (author) searchQuery.author = { $regex: author, $options: 'i' }
    if (minPrice !== undefined || maxPrice !== undefined) {
      searchQuery.price = {}
      if (minPrice !== undefined) searchQuery.price.$gte = minPrice
      if (maxPrice !== undefined) searchQuery.price.$lte = maxPrice
    }

    // Tính toán pagination
    const skip = (page - 1) * limit

    // Tìm kiếm sách
    const books = await Book.find(searchQuery)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Đếm tổng số kết quả
    const total = await Book.countDocuments(searchQuery)

    return {
      books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Lấy sách bán chạy
   */
  async getBestsellers(limit) {
    // Lấy từ cache trước
    // Cache removed - direct database query

    // Lấy sách bán chạy từ database
    const books = await Book.aggregate([
      {
        $lookup: {
          from: 'orderitems',
          localField: '_id',
          foreignField: 'bookId',
          as: 'orderItems'
        }
      },
      {
        $addFields: {
          totalSold: { $sum: '$orderItems.quantity' }
        }
      },
      {
        $match: { isActive: true, totalSold: { $gt: 0 } }
      },
      {
        $sort: { totalSold: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: { path: '$category', preserveNullAndEmptyArrays: true }
      }
    ])

    // Cache kết quả
    // Cache removed

    return books
  }

  /**
   * Lấy sách mới
   */
  async getNewBooks(limit) {
    // Lấy từ cache trước
    // Cache removed - direct database query

    // Lấy sách mới
    const books = await Book.find({ isActive: true })
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)

    // Cache removed

    return books
  }

  /**
   * Lấy sách theo danh mục
   */
  async getBooksByCategory(categoryId, filters) {
    const { page, limit, sortBy, sortOrder } = filters

    // Kiểm tra category tồn tại
    const category = await Category.findById(categoryId)
    if (!category) {
      throw new AppError('Category not found', 404)
    }

    // Xây dựng sort
    const sort = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Tính toán pagination
    const skip = (page - 1) * limit

    // Lấy sách theo category
    const books = await Book.find({ categoryId, isActive: true })
      .populate('categoryId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit)

    // Đếm tổng số sách
    const total = await Book.countDocuments({ categoryId, isActive: true })

    return {
      books,
      category,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Lấy sách theo tác giả
   */
  async getBooksByAuthor(author, filters) {
    const { page, limit, sortBy, sortOrder } = filters

    // Xây dựng sort
    const sort = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Tính toán pagination
    const skip = (page - 1) * limit

    // Lấy sách theo tác giả
    const books = await Book.find({
      author: { $regex: author, $options: 'i' },
      isActive: true
    })
      .populate('categoryId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit)

    // Đếm tổng số sách
    const total = await Book.countDocuments({
      author: { $regex: author, $options: 'i' },
      isActive: true
    })

    return {
      books,
      author,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Upload ảnh sách
   */
  async uploadBookImage(bookId, imageFile) {
    const book = await Book.findById(bookId)
    if (!book) {
      throw new AppError('Book not found', 404)
    }

    // Xử lý upload ảnh (sẽ được implement sau)
    const imageUrl = `/uploads/books/${imageFile.filename}`

    // Cập nhật ảnh sách
    book.image = imageUrl
    await book.save()

    return { imageUrl }
  }

  /**
   * Cập nhật số lượng tồn kho
   */
  async updateStock(bookId, quantity, operation) {
    const book = await Book.findById(bookId)
    if (!book) {
      throw new AppError('Book not found', 404)
    }

    let newStock
    switch (operation) {
      case 'set':
        newStock = quantity
        break
      case 'add':
        newStock = book.stock + quantity
        break
      case 'subtract':
        newStock = book.stock - quantity
        if (newStock < 0) {
          throw new AppError('Insufficient stock', 400)
        }
        break
      default:
        throw new AppError('Invalid operation', 400)
    }

    book.stock = newStock
    await book.save()

    return { stock: newStock }
  }

  /**
   * Lấy thống kê sách
   */
  async getBookStatistics() {
    const stats = await Book.aggregate([
      {
        $group: {
          _id: null,
          totalBooks: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          averagePrice: { $avg: '$price' },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
        }
      }
    ])

    const categoryStats = await Book.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $group: {
          _id: '$category.name',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])

    return {
      overview: stats[0] || {
        totalBooks: 0,
        totalStock: 0,
        averagePrice: 0,
        totalValue: 0
      },
      categoryStats
    }
  }

  /**
   * Xóa cache liên quan đến sách
   */
  async clearBookCache() {
    const patterns = ['bestsellers:*', 'new_books:*', 'books:*']
    
    for (const pattern of patterns) {
      // Xóa cache theo pattern (sẽ implement sau)
      // Cache invalidation removed
    }
  }
}

export default new BookService()