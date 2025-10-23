import User from '~/models/userModel'
import Book from '~/models/bookModel'
import Favorite from '~/models/favoriteModel'
import AppError from '~/utils/AppError'

/**
 * Favorite Controller - Xử lý logic yêu thích sách
 * Theo Service-Based Architecture: Controller chỉ xử lý request/response
 */

// Thêm sách vào danh sách yêu thích
export const addToFavorites = async (req, res, next) => {
  try {
    const { bookId } = req.params
    const userId = req.user._id

    // Kiểm tra sách có tồn tại không
    const book = await Book.findById(bookId)
    if (!book) {
      return next(new AppError('Book not found', 404))
    }

    // Kiểm tra user có tồn tại không
    const user = await User.findById(userId)
    if (!user) {
      return next(new AppError('User not found', 404))
    }

    // Kiểm tra sách đã có trong favorites chưa
    const existingFavorite = await Favorite.findOne({ userId: userId, bookId: bookId })
    if (existingFavorite && existingFavorite.isFavourite) {
      return res.status(400).json({
        success: false,
        message: 'Book already in favorites'
      })
    }

    // Tạo hoặc cập nhật favorite
    let favorite
    if (existingFavorite) {
      // Cập nhật favorite hiện có
      favorite = await Favorite.findByIdAndUpdate(
        existingFavorite._id,
        { isFavourite: true },
        { new: true }
      )
    } else {
      // Tạo favorite mới
      favorite = await Favorite.create({
        userId: userId,
        bookId: bookId,
        isFavourite: true
      })
    }

    res.status(200).json({
      success: true,
      message: 'Book added to favorites successfully',
      data: {
        favorite
      }
    })
  } catch (error) {
    next(error)
  }
}

// Xóa sách khỏi danh sách yêu thích
export const removeFromFavorites = async (req, res, next) => {
  try {
    const { bookId } = req.params
    const userId = req.user._id

    // Kiểm tra sách có tồn tại không
    const book = await Book.findById(bookId)
    if (!book) {
      return next(new AppError('Book not found', 404))
    }

    // Kiểm tra user có tồn tại không
    const user = await User.findById(userId)
    if (!user) {
      return next(new AppError('User not found', 404))
    }

    // Tìm favorite record
    const favorite = await Favorite.findOne({ userId: userId, bookId: bookId })
    if (!favorite || !favorite.isFavourite) {
      return res.status(400).json({
        success: false,
        message: 'Book not in favorites'
      })
    }

    // Cập nhật isFavourite thành false
    favorite.isFavourite = false
    await favorite.save()

    res.status(200).json({
      success: true,
      message: 'Book removed from favorites successfully',
      data: {
        favorite
      }
    })
  } catch (error) {
    next(error)
  }
}

// Lấy danh sách sách yêu thích
export const getFavorites = async (req, res, next) => {
  try {
    const userId = req.user._id

    const user = await User.findById(userId)
    if (!user) {
      return next(new AppError('User not found', 404))
    }

    // Lấy danh sách favorites với isFavourite = true
    const favorites = await Favorite.getUserFavorites(userId, true)

    res.status(200).json({
      success: true,
      message: 'Favorites retrieved successfully',
      data: {
        favorites
      }
    })
  } catch (error) {
    next(error)
  }
}

// Kiểm tra sách có trong favorites không
export const checkFavorite = async (req, res, next) => {
  try {
    const { bookId } = req.params
    const userId = req.user._id

    const user = await User.findById(userId)
    if (!user) {
      return next(new AppError('User not found', 404))
    }

    const isFavorite = await Favorite.isBookFavorite(userId, bookId)

    res.status(200).json({
      success: true,
      data: {
        isFavorite
      }
    })
  } catch (error) {
    next(error)
  }
}

// Lấy danh sách sách yêu thích với pagination
export const getFavoritesWithPagination = async (req, res, next) => {
  try {
    const userId = req.user._id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10

    const user = await User.findById(userId)
    if (!user) {
      return next(new AppError('User not found', 404))
    }

    const skip = (page - 1) * limit

    // Lấy favorites với pagination
    const favorites = await Favorite.find({ userId: userId, isFavourite: true })
      .populate({
        path: 'bookId',
        populate: {
          path: 'categoryId',
          select: 'name'
        }
      })
      .skip(skip)
      .limit(limit)

    const total = await Favorite.countDocuments({ userId: userId, isFavourite: true })
    const pages = Math.ceil(total / limit)

    // Extract books from favorites
    const books = favorites.map(fav => fav.bookId).filter(book => book && book.isActive && !book.isDeleted)

    res.status(200).json({
      success: true,
      message: 'Favorites retrieved successfully',
      data: {
        books,
        pagination: {
          page,
          limit,
          total,
          pages
        }
      }
    })
  } catch (error) {
    next(error)
  }
}
