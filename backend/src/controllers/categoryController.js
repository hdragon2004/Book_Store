import { StatusCodes } from 'http-status-codes'
import categoryService from '~/services/categoryService'
import { asyncHandler } from '~/utils/asyncHandler'
import { ApiResponse } from '~/utils/ApiResponse'

/**
 * Category Controller - Xử lý các request liên quan đến danh mục sách
 * Theo Service-Based Architecture: Controller chỉ xử lý request/response
 * Business logic được xử lý trong Service layer
 */

class CategoryController {
  /**
   * Tạo danh mục mới (Admin only)
   * POST /api/categories
   */
  createCategory = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    // Gọi service để tạo danh mục
    const category = await categoryService.createCategory({
      name,
      description
    })

    res.status(StatusCodes.CREATED).json(
      new ApiResponse(StatusCodes.CREATED, category, 'Category created successfully')
    )
  })

  /**
   * Lấy danh sách danh mục
   * GET /api/categories
   */
  getCategories = asyncHandler(async (req, res) => {
    const { page, limit, sortBy, sortOrder } = req.query

    // Nếu không có page/limit thì lấy hết (không phân trang)
    const pagination = page && limit ? {
      page: parseInt(page),
      limit: parseInt(limit)
    } : null

    // Gọi service để lấy danh sách danh mục
    const result = await categoryService.getCategories({
      pagination,
      sortBy,
      sortOrder
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Categories retrieved successfully')
    )
  })

  /**
   * Lấy danh mục theo ID
   * GET /api/categories/:id
   */
  getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params

    // Gọi service để lấy danh mục
    const category = await categoryService.getCategoryById(id)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, category, 'Category retrieved successfully')
    )
  })

  /**
   * Cập nhật danh mục (Admin only)
   * PUT /api/categories/:id
   */
  updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { name, description } = req.body

    // Gọi service để cập nhật danh mục
    const updatedCategory = await categoryService.updateCategory(id, {
      name,
      description
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, updatedCategory, 'Category updated successfully')
    )
  })

  /**
   * Xóa danh mục (Admin only)
   * DELETE /api/categories/:id
   */
  deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params

    // Gọi service để xóa danh mục
    await categoryService.deleteCategory(id)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, null, 'Category deleted successfully')
    )
  })

  /**
   * Tìm kiếm danh mục
   * GET /api/categories/search
   */
  searchCategories = asyncHandler(async (req, res) => {
    const { q, page, limit } = req.query

    if (!q) {
      return res.status(StatusCodes.BAD_REQUEST).json(
        new ApiResponse(StatusCodes.BAD_REQUEST, null, 'Search term is required')
      )
    }

    // Gọi service để tìm kiếm danh mục
    const result = await categoryService.searchCategories(q, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Search results retrieved successfully')
    )
  })

  /**
   * Lấy thống kê danh mục
   * GET /api/categories/stats
   */
  getCategoryStats = asyncHandler(async (req, res) => {
    // Gọi service để lấy thống kê
    const stats = await categoryService.getCategoryStats()

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, stats, 'Category stats retrieved successfully')
    )
  })
}

export default new CategoryController()