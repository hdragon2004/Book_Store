import { StatusCodes } from 'http-status-codes'
import reportService from '~/services/reportService'
import { asyncHandler } from '~/utils/asyncHandler'
import { ApiResponse } from '~/utils/ApiResponse'

/**
 * Report Controller - Xử lý các request liên quan đến báo cáo
 */

class ReportController {
  /**
   * Báo cáo doanh thu
   * GET /api/v1/reports/revenue
   */
  getRevenueReport = asyncHandler(async (req, res) => {
    const result = await reportService.getRevenueReport(req.query)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Revenue report retrieved successfully')
    )
  })

  /**
   * Báo cáo sách bán chạy
   * GET /api/v1/reports/bestsellers
   */
  getBestsellerReport = asyncHandler(async (req, res) => {
    const result = await reportService.getBestsellerReport(req.query)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Bestseller report retrieved successfully')
    )
  })

  /**
   * Báo cáo khách hàng
   * GET /api/v1/reports/customers
   */
  getCustomerReport = asyncHandler(async (req, res) => {
    const result = await reportService.getCustomerReport(req.query)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Customer report retrieved successfully')
    )
  })

  /**
   * Báo cáo danh mục
   * GET /api/v1/reports/categories
   */
  getCategoryReport = asyncHandler(async (req, res) => {
    const result = await reportService.getCategoryReport(req.query)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Category report retrieved successfully')
    )
  })

  /**
   * Báo cáo voucher
   * GET /api/v1/reports/vouchers
   */
  getVoucherReport = asyncHandler(async (req, res) => {
    const result = await reportService.getVoucherReport(req.query)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Voucher report retrieved successfully')
    )
  })

  /**
   * Báo cáo tồn kho
   * GET /api/v1/reports/inventory
   */
  getInventoryReport = asyncHandler(async (req, res) => {
    const result = await reportService.getInventoryReport(req.query)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Inventory report retrieved successfully')
    )
  })

  /**
   * Dashboard tổng quan
   * GET /api/v1/reports/dashboard
   */
  getDashboardStats = asyncHandler(async (req, res) => {
    const result = await reportService.getDashboardStats(req.query)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Dashboard stats retrieved successfully')
    )
  })

  /**
   * Export báo cáo (CSV/Excel)
   * GET /api/v1/reports/export/:type
   */
  exportReport = asyncHandler(async (req, res) => {
    const { type } = req.params
    const { format = 'csv' } = req.query

    let reportData
    let filename

    switch (type) {
      case 'revenue':
        reportData = await reportService.getRevenueReport(req.query)
        filename = `revenue-report-${new Date().toISOString().split('T')[0]}.${format}`
        break
      case 'bestsellers':
        reportData = await reportService.getBestsellerReport(req.query)
        filename = `bestsellers-report-${new Date().toISOString().split('T')[0]}.${format}`
        break
      case 'customers':
        reportData = await reportService.getCustomerReport(req.query)
        filename = `customers-report-${new Date().toISOString().split('T')[0]}.${format}`
        break
      case 'categories':
        reportData = await reportService.getCategoryReport(req.query)
        filename = `categories-report-${new Date().toISOString().split('T')[0]}.${format}`
        break
      case 'vouchers':
        reportData = await reportService.getVoucherReport(req.query)
        filename = `vouchers-report-${new Date().toISOString().split('T')[0]}.${format}`
        break
      case 'inventory':
        reportData = await reportService.getInventoryReport(req.query)
        filename = `inventory-report-${new Date().toISOString().split('T')[0]}.${format}`
        break
      default:
        throw new AppError('Invalid report type', 400)
    }

    // Set headers for file download
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    // Convert data to CSV format (simplified)
    if (format === 'csv') {
      const csv = this.convertToCSV(reportData)
      res.send(csv)
    } else {
      // For Excel export, you would use a library like xlsx
      res.json(reportData)
    }
  })

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    if (!data || typeof data !== 'object') return ''

    const flattenObject = (obj, prefix = '') => {
      let result = []
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newKey = prefix ? `${prefix}.${key}` : key
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            result = result.concat(flattenObject(obj[key], newKey))
          } else {
            result.push(`${newKey},${obj[key]}`)
          }
        }
      }
      return result
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return ''
      const headers = Object.keys(data[0]).join(',')
      const rows = data.map(item => Object.values(item).join(','))
      return [headers, ...rows].join('\n')
    } else {
      return flattenObject(data).join('\n')
    }
  }
}

export default new ReportController()
