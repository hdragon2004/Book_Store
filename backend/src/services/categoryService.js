import Category from '~/models/categoryModel'
import Book from '~/models/bookModel'
import { AppError } from '~/utils/AppError'

/**
 * Category Service - Xử lý business logic liên quan đến danh mục sách
 * Theo Service-Based Architecture: Service chứa tất cả business logic
 */

class CategoryService {
  /**
   * Tạo danh mục mới
   */
  async createCategory(categoryData) {
    const { name, description } = categoryData

    // Kiểm tra tên danh mục đã tồn tại
    const existingCategory = await Category.findOne({ name })
    if (existingCategory) {
      throw new AppError('Category name already exists', 400)
    }

    // Tạo danh mục mới
    const category = await Category.create({
      name,
      description
    })

    return category
  }

  /**
   * Lấy danh sách danh mục
   */
  async getCategories(filters = {}) {
    const { pagination, sortBy = 'createdAt', sortOrder = 'desc' } = filters

    // Xây dựng query
    const query = {}

    // Xây dựng sort
    const sort = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Lấy danh mục
    let categoriesQuery = Category.find(query).sort(sort)

    // Nếu có pagination thì áp dụng skip/limit
    if (pagination) {
      const { page, limit } = pagination
      const skip = (page - 1) * limit
      categoriesQuery = categoriesQuery.skip(skip).limit(limit)
    }

    const categories = await categoriesQuery

    // Nếu có pagination thì trả về thông tin pagination
    if (pagination) {
      const total = await Category.countDocuments(query)
      return {
        categories,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          pages: Math.ceil(total / pagination.limit)
        }
      }
    }

    // Nếu không có pagination thì chỉ trả về categories
    return { categories }
  }

  /**
   * Lấy danh mục theo ID
   */
  async getCategoryById(categoryId) {
    const category = await Category.findById(categoryId)
    if (!category) {
      throw new AppError('Category not found', 404)
    }
    return category
  }

  /**
   * Cập nhật danh mục
   */
  async updateCategory(categoryId, updateData) {
    const { name, description } = updateData

    // Kiểm tra danh mục tồn tại
    const category = await Category.findById(categoryId)
    if (!category) {
      throw new AppError('Category not found', 404)
    }

    // Kiểm tra tên danh mục đã tồn tại (nếu thay đổi tên)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name })
      if (existingCategory) {
        throw new AppError('Category name already exists', 400)
      }
    }

    // Cập nhật danh mục
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { name, description },
      { new: true, runValidators: true }
    )

    return updatedCategory
  }

  /**
   * Xóa danh mục
   */
  async deleteCategory(categoryId) {
    // Kiểm tra danh mục tồn tại
    const category = await Category.findById(categoryId)
    if (!category) {
      throw new AppError('Category not found', 404)
    }

    // Kiểm tra có sách nào thuộc danh mục này không
    const booksCount = await Book.countDocuments({ categoryId })
    if (booksCount > 0) {
      throw new AppError('Cannot delete category that has books', 400)
    }

    // Xóa danh mục
    await Category.findByIdAndDelete(categoryId)
    return { message: 'Category deleted successfully' }
  }

  /**
   * Tìm kiếm danh mục
   */
  async searchCategories(searchTerm, filters = {}) {
    const { page = 1, limit = 10 } = filters

    // Xây dựng query tìm kiếm
    const query = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    }

    // Tính toán pagination
    const skip = (page - 1) * limit

    // Tìm kiếm danh mục
    const categories = await Category.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Đếm tổng số kết quả
    const total = await Category.countDocuments(query)

    return {
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Lấy thống kê danh mục
   */
  async getCategoryStats() {
    const totalCategories = await Category.countDocuments()
    const categoriesWithBooks = await Category.aggregate([
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'books'
        }
      },
      {
        $match: {
          'books.0': { $exists: true }
        }
      },
      {
        $count: 'count'
      }
    ])

    return {
      totalCategories,
      categoriesWithBooks: categoriesWithBooks[0]?.count || 0
    }
  }
}

export default new CategoryService()