import Cart from '~/models/cartModel'
import Book from '~/models/bookModel'
import User from '~/models/userModel'
import { AppError } from '~/utils/AppError'
import { asyncHandler } from '~/utils/asyncHandler'
import { ApiResponse } from '~/utils/ApiResponse'

/**
 * Cart Controller - Xử lý logic giỏ hàng
 * Theo Service-Based Architecture: Controller chỉ xử lý request/response
 */

// Lấy giỏ hàng của user
export const getCart = asyncHandler(async (req, res) => {
  const userId = req.user._id

  // Kiểm tra user có tồn tại không
  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  const cart = await Cart.getUserCart(userId)
  
  if (!cart) {
    return res.status(200).json(
      new ApiResponse(200, {
        cart: {
          items: [],
          totalItems: 0,
          totalPrice: 0
        }
      }, 'Cart retrieved successfully')
    )
  }

  // Tính tổng giá
  let totalPrice = 0
  const itemsWithPrice = cart.items.map(item => {
    const itemTotal = item.bookId.price * item.quantity
    totalPrice += itemTotal
    return {
      ...item.toObject(),
      totalPrice: itemTotal
    }
  })

  res.status(200).json(
    new ApiResponse(200, {
      cart: {
        items: itemsWithPrice,
        totalItems: cart.totalItems,
        totalPrice
      }
    }, 'Cart retrieved successfully')
  )
})

// Thêm sách vào giỏ hàng
export const addToCart = asyncHandler(async (req, res) => {
  const { bookId } = req.params
  const { quantity = 1 } = req.body
  const userId = req.user._id

  // Kiểm tra sách có tồn tại không
  const book = await Book.findById(bookId)
  if (!book) {
    throw new AppError('Book not found', 404)
  }

  // Kiểm tra tồn kho
  if (book.stock < quantity) {
    throw new AppError('Insufficient stock', 400)
  }

  // Kiểm tra user có tồn tại không
  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Thêm vào giỏ hàng
  const cart = await Cart.addItem(userId, bookId, quantity)

  // Tính tổng giá sau khi thêm
  let totalPrice = 0
  const itemsWithPrice = cart.items.map(item => {
    const itemTotal = item.bookId.price * item.quantity
    totalPrice += itemTotal
    return {
      ...item.toObject(),
      totalPrice: itemTotal
    }
  })

  res.status(200).json(
    new ApiResponse(200, {
      message: 'Book added to cart successfully',
      cart: {
        items: itemsWithPrice,
        totalItems: cart.totalItems,
        totalPrice
      }
    }, 'Book added to cart successfully')
  )
})

// Cập nhật số lượng sách trong giỏ hàng
export const updateCartItem = asyncHandler(async (req, res) => {
  const { bookId } = req.params
  const { quantity } = req.body
  const userId = req.user._id

  if (quantity < 0) {
    throw new AppError('Quantity cannot be negative', 400)
  }

  // Kiểm tra user có tồn tại không
  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Kiểm tra sách có tồn tại không
  const book = await Book.findById(bookId)
  if (!book) {
    throw new AppError('Book not found', 404)
  }

  // Kiểm tra tồn kho nếu quantity > 0
  if (quantity > 0 && book.stock < quantity) {
    throw new AppError('Insufficient stock', 400)
  }

  // Cập nhật giỏ hàng
  const cart = await Cart.updateItemQuantity(userId, bookId, quantity)

  // Tính tổng giá sau khi cập nhật
  let totalPrice = 0
  const itemsWithPrice = cart.items.map(item => {
    const itemTotal = item.bookId.price * item.quantity
    totalPrice += itemTotal
    return {
      ...item.toObject(),
      totalPrice: itemTotal
    }
  })

  res.status(200).json(
    new ApiResponse(200, {
      message: 'Cart item updated successfully',
      cart: {
        items: itemsWithPrice,
        totalItems: cart.totalItems,
        totalPrice
      }
    }, 'Cart item updated successfully')
  )
})

// Xóa sách khỏi giỏ hàng
export const removeFromCart = asyncHandler(async (req, res) => {
  const { bookId } = req.params
  const userId = req.user._id

  // Kiểm tra user có tồn tại không
  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Xóa khỏi giỏ hàng
  const cart = await Cart.removeItem(userId, bookId)

  // Tính tổng giá sau khi xóa
  let totalPrice = 0
  const itemsWithPrice = cart.items.map(item => {
    const itemTotal = item.bookId.price * item.quantity
    totalPrice += itemTotal
    return {
      ...item.toObject(),
      totalPrice: itemTotal
    }
  })

  res.status(200).json(
    new ApiResponse(200, {
      message: 'Book removed from cart successfully',
      cart: {
        items: itemsWithPrice,
        totalItems: cart.totalItems,
        totalPrice
      }
    }, 'Book removed from cart successfully')
  )
})

// Xóa tất cả sách khỏi giỏ hàng
export const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user._id

  // Kiểm tra user có tồn tại không
  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Xóa tất cả khỏi giỏ hàng
  const cart = await Cart.clearCart(userId)

  res.status(200).json(
    new ApiResponse(200, {
      message: 'Cart cleared successfully',
      cart: {
        items: [],
        totalItems: 0,
        totalPrice: 0
      }
    }, 'Cart cleared successfully')
  )
})

// Lấy tóm tắt giỏ hàng
export const getCartSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id

  // Kiểm tra user có tồn tại không
  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  const summary = await Cart.getCartSummary(userId)

  res.status(200).json(
    new ApiResponse(200, {
      summary
    }, 'Cart summary retrieved successfully')
  )
})

// Kiểm tra sách có trong giỏ hàng không
export const checkCartItem = asyncHandler(async (req, res) => {
  const { bookId } = req.params
  const userId = req.user._id

  const cart = await Cart.findOne({ userId })
  
  if (!cart) {
    return res.status(200).json(
      new ApiResponse(200, {
        inCart: false,
        quantity: 0
      }, 'Item not in cart')
    )
  }

  const item = cart.items.find(item => item.bookId.toString() === bookId)
  
  res.status(200).json(
    new ApiResponse(200, {
      inCart: !!item,
      quantity: item ? item.quantity : 0
    }, 'Cart item status retrieved successfully')
  )
})
