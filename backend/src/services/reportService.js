import Order from '~/models/orderModel'
import OrderItem from '~/models/orderItemModel'
import Book from '~/models/bookModel'
import User from '~/models/userModel'
import Category from '~/models/categoryModel'
import Voucher from '~/models/voucherModel'
import VoucherUsage from '~/models/voucherUsageModel'
import { AppError } from '~/utils/AppError'

/**
 * Report Service - Xử lý báo cáo và thống kê chi tiết
 */

class ReportService {
  /**
   * Báo cáo doanh thu tổng quan
   */
  async getRevenueReport(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        groupBy = 'day', // day, week, month, year
        paymentMethod,
        status
      } = filters

      // Build match conditions
      const matchConditions = { isDeleted: false }
      
      if (startDate || endDate) {
        matchConditions.createdAt = {}
        if (startDate) matchConditions.createdAt.$gte = new Date(startDate)
        if (endDate) matchConditions.createdAt.$lte = new Date(endDate)
      }
      
      if (paymentMethod) matchConditions.paymentMethod = paymentMethod
      if (status) matchConditions.status = status

      // Group by date
      let groupFormat
      switch (groupBy) {
        case 'day':
          groupFormat = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          }
          break
        case 'week':
          groupFormat = {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' }
          }
          break
        case 'month':
          groupFormat = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          }
          break
        case 'year':
          groupFormat = {
            year: { $year: '$createdAt' }
          }
          break
      }

      const revenueData = await Order.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: groupFormat,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            totalOriginalAmount: { $sum: '$originalAmount' },
            totalDiscount: { $sum: '$discountAmount' },
            averageOrderValue: { $avg: '$totalPrice' }
          }
        },
        { $sort: { '_id': 1 } }
      ])

      // Tổng quan
      const overview = await Order.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            totalOriginalAmount: { $sum: '$originalAmount' },
            totalDiscount: { $sum: '$discountAmount' },
            averageOrderValue: { $avg: '$totalPrice' }
          }
        }
      ])

      return {
        overview: overview[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          totalOriginalAmount: 0,
          totalDiscount: 0,
          averageOrderValue: 0
        },
        revenueData
      }
    } catch (error) {
      throw new AppError(`Failed to get revenue report: ${error.message}`, 500)
    }
  }

  /**
   * Báo cáo sách bán chạy
   */
  async getBestsellerReport(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        limit = 10,
        categoryId
      } = filters

      const matchConditions = { isDeleted: false }
      
      if (startDate || endDate) {
        matchConditions.createdAt = {}
        if (startDate) matchConditions.createdAt.$gte = new Date(startDate)
        if (endDate) matchConditions.createdAt.$lte = new Date(endDate)
      }

      const bestsellerData = await OrderItem.aggregate([
        {
          $lookup: {
            from: 'orders',
            localField: 'orderId',
            foreignField: '_id',
            as: 'order'
          }
        },
        { $unwind: '$order' },
        { $match: { 'order.isDeleted': false } },
        {
          $lookup: {
            from: 'books',
            localField: 'bookId',
            foreignField: '_id',
            as: 'book'
          }
        },
        { $unwind: '$book' },
        ...(categoryId ? [{ $match: { 'book.categoryId': categoryId } }] : []),
        {
          $group: {
            _id: '$bookId',
            bookTitle: { $first: '$book.title' },
            bookAuthor: { $first: '$book.author' },
            bookPrice: { $first: '$book.price' },
            bookImage: { $first: '$book.imageUrl' },
            totalQuantitySold: { $sum: '$quantity' },
            totalRevenue: { $sum: { $multiply: ['$quantity', '$priceAtPurchase'] } },
            totalOrders: { $sum: 1 }
          }
        },
        { $sort: { totalQuantitySold: -1 } },
        { $limit: limit }
      ])

      return bestsellerData
    } catch (error) {
      throw new AppError(`Failed to get bestseller report: ${error.message}`, 500)
    }
  }

  /**
   * Báo cáo khách hàng
   */
  async getCustomerReport(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        limit = 10
      } = filters

      const matchConditions = { isDeleted: false }
      
      if (startDate || endDate) {
        matchConditions.createdAt = {}
        if (startDate) matchConditions.createdAt.$gte = new Date(startDate)
        if (endDate) matchConditions.createdAt.$lte = new Date(endDate)
      }

      // Top customers by spending
      const topCustomers = await Order.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$userId',
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$totalPrice' },
            averageOrderValue: { $avg: '$totalPrice' },
            lastOrderDate: { $max: '$createdAt' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            userId: '$_id',
            userName: '$user.name',
            userEmail: '$user.email',
            totalOrders: 1,
            totalSpent: 1,
            averageOrderValue: 1,
            lastOrderDate: 1
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: limit }
      ])

      // Customer statistics
      const customerStats = await Order.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            totalCustomers: { $addToSet: '$userId' },
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' }
          }
        },
        {
          $project: {
            totalUniqueCustomers: { $size: '$totalCustomers' },
            totalOrders: 1,
            totalRevenue: 1,
            averageOrdersPerCustomer: { $divide: ['$totalOrders', { $size: '$totalCustomers' }] }
          }
        }
      ])

      return {
        topCustomers,
        customerStats: customerStats[0] || {
          totalUniqueCustomers: 0,
          totalOrders: 0,
          totalRevenue: 0,
          averageOrdersPerCustomer: 0
        }
      }
    } catch (error) {
      throw new AppError(`Failed to get customer report: ${error.message}`, 500)
    }
  }

  /**
   * Báo cáo danh mục
   */
  async getCategoryReport(filters = {}) {
    try {
      const {
        startDate,
        endDate
      } = filters

      const matchConditions = { isDeleted: false }
      
      if (startDate || endDate) {
        matchConditions.createdAt = {}
        if (startDate) matchConditions.createdAt.$gte = new Date(startDate)
        if (endDate) matchConditions.createdAt.$lte = new Date(endDate)
      }

      const categoryData = await OrderItem.aggregate([
        {
          $lookup: {
            from: 'orders',
            localField: 'orderId',
            foreignField: '_id',
            as: 'order'
          }
        },
        { $unwind: '$order' },
        { $match: { 'order.isDeleted': false } },
        {
          $lookup: {
            from: 'books',
            localField: 'bookId',
            foreignField: '_id',
            as: 'book'
          }
        },
        { $unwind: '$book' },
        {
          $lookup: {
            from: 'categories',
            localField: 'book.categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        {
          $group: {
            _id: '$category._id',
            categoryName: { $first: '$category.name' },
            totalBooksSold: { $sum: '$quantity' },
            totalRevenue: { $sum: { $multiply: ['$quantity', '$priceAtPurchase'] } },
            totalOrders: { $addToSet: '$orderId' }
          }
        },
        {
          $project: {
            categoryId: '$_id',
            categoryName: 1,
            totalBooksSold: 1,
            totalRevenue: 1,
            totalOrders: { $size: '$totalOrders' }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ])

      return categoryData
    } catch (error) {
      throw new AppError(`Failed to get category report: ${error.message}`, 500)
    }
  }

  /**
   * Báo cáo voucher
   */
  async getVoucherReport(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        voucherId
      } = filters

      const matchConditions = {}
      
      if (startDate || endDate) {
        matchConditions.usedAt = {}
        if (startDate) matchConditions.usedAt.$gte = new Date(startDate)
        if (endDate) matchConditions.usedAt.$lte = new Date(endDate)
      }
      
      if (voucherId) matchConditions.voucherId = voucherId

      const voucherData = await VoucherUsage.aggregate([
        { $match: matchConditions },
        {
          $lookup: {
            from: 'vouchers',
            localField: 'voucherId',
            foreignField: '_id',
            as: 'voucher'
          }
        },
        { $unwind: '$voucher' },
        {
          $group: {
            _id: '$voucherId',
            voucherCode: { $first: '$voucher.code' },
            voucherName: { $first: '$voucher.name' },
            voucherType: { $first: '$voucher.type' },
            totalUsage: { $sum: 1 },
            totalDiscountGiven: { $sum: '$discountAmount' },
            totalOrderAmount: { $sum: '$orderAmount' },
            refundedUsage: {
              $sum: { $cond: ['$isRefunded', 1, 0] }
            },
            refundedAmount: {
              $sum: { $cond: ['$isRefunded', '$discountAmount', 0] }
            }
          }
        },
        {
          $project: {
            voucherId: '$_id',
            voucherCode: 1,
            voucherName: 1,
            voucherType: 1,
            totalUsage: 1,
            totalDiscountGiven: 1,
            totalOrderAmount: 1,
            refundedUsage: 1,
            refundedAmount: 1,
            netDiscount: { $subtract: ['$totalDiscountGiven', '$refundedAmount'] }
          }
        },
        { $sort: { totalDiscountGiven: -1 } }
      ])

      return voucherData
    } catch (error) {
      throw new AppError(`Failed to get voucher report: ${error.message}`, 500)
    }
  }

  /**
   * Báo cáo tồn kho
   */
  async getInventoryReport(filters = {}) {
    try {
      const {
        categoryId,
        lowStockThreshold = 10,
        sortBy = 'stock',
        sortOrder = 'asc'
      } = filters

      const matchConditions = { isActive: true }
      if (categoryId) matchConditions.categoryId = categoryId

      const inventoryData = await Book.aggregate([
        { $match: matchConditions },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        {
          $project: {
            bookId: '$_id',
            title: 1,
            author: 1,
            price: 1,
            stock: 1,
            categoryName: '$category.name',
            totalValue: { $multiply: ['$price', '$stock'] },
            isLowStock: { $lt: ['$stock', lowStockThreshold] }
          }
        },
        { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } }
      ])

      // Thống kê tổng quan
      const overview = await Book.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            totalBooks: { $sum: 1 },
            totalStock: { $sum: '$stock' },
            totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
            lowStockBooks: {
              $sum: { $cond: [{ $lt: ['$stock', lowStockThreshold] }, 1, 0] }
            }
          }
        }
      ])

      return {
        inventoryData,
        overview: overview[0] || {
          totalBooks: 0,
          totalStock: 0,
          totalValue: 0,
          lowStockBooks: 0
        }
      }
    } catch (error) {
      throw new AppError(`Failed to get inventory report: ${error.message}`, 500)
    }
  }

  /**
   * Dashboard tổng quan
   */
  async getDashboardStats(filters = {}) {
    try {
      const {
        startDate,
        endDate
      } = filters

      const matchConditions = { isDeleted: false }
      
      if (startDate || endDate) {
        matchConditions.createdAt = {}
        if (startDate) matchConditions.createdAt.$gte = new Date(startDate)
        if (endDate) matchConditions.createdAt.$lte = new Date(endDate)
      }

      // Thống kê đơn hàng
      const orderStats = await Order.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            totalOriginalAmount: { $sum: '$originalAmount' },
            totalDiscount: { $sum: '$discountAmount' },
            averageOrderValue: { $avg: '$totalPrice' }
          }
        }
      ])

      // Thống kê theo trạng thái
      const statusStats = await Order.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            revenue: { $sum: '$totalPrice' }
          }
        }
      ])

      // Thống kê khách hàng
      const customerStats = await Order.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            uniqueCustomers: { $addToSet: '$userId' }
          }
        },
        {
          $project: {
            totalUniqueCustomers: { $size: '$uniqueCustomers' }
          }
        }
      ])

      // Thống kê sách
      const bookStats = await Book.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalBooks: { $sum: 1 },
            totalStock: { $sum: '$stock' },
            totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
          }
        }
      ])

      return {
        orderStats: orderStats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          totalOriginalAmount: 0,
          totalDiscount: 0,
          averageOrderValue: 0
        },
        statusStats,
        customerStats: customerStats[0] || { totalUniqueCustomers: 0 },
        bookStats: bookStats[0] || {
          totalBooks: 0,
          totalStock: 0,
          totalValue: 0
        }
      }
    } catch (error) {
      throw new AppError(`Failed to get dashboard stats: ${error.message}`, 500)
    }
  }
}

export default new ReportService()
