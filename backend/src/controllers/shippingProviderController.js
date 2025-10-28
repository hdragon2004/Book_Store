import ShippingProvider from '~/models/shippingProviderModel'
import { AppError } from '~/utils/AppError'

/**
 * Controller cho Shipping Provider
 * Xử lý các request liên quan đến đơn vị giao hàng
 */

// Lấy tất cả đơn vị giao hàng (có phân trang, tìm kiếm, lọc)
export const getAllProviders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      active,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    // Xây dựng query
    const query = { isDeleted: false }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (active !== undefined) {
      query.active = active === 'true'
    }

    // Xây dựng sort
    const sort = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Tính toán phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Lấy dữ liệu
    const providers = await ShippingProvider.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await ShippingProvider.countDocuments(query)

    res.json({
      success: true,
      statusCode: 200,
      message: 'Shipping providers retrieved successfully',
      data: {
        providers,
        total,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting shipping providers:', error)
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

// Lấy đơn vị giao hàng theo ID
export const getProviderById = async (req, res) => {
  try {
    const { providerId } = req.params

    const provider = await ShippingProvider.findOne({
      _id: providerId,
      isDeleted: false
    })

    if (!provider) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Shipping provider not found',
        timestamp: new Date().toISOString()
      })
    }

    res.json({
      success: true,
      statusCode: 200,
      message: 'Shipping provider retrieved successfully',
      data: { provider },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting shipping provider:', error)
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

// Tạo đơn vị giao hàng mới
export const createProvider = async (req, res) => {
  try {
    const providerData = req.body

    // Kiểm tra code đã tồn tại chưa
    const existingProvider = await ShippingProvider.findOne({
      code: providerData.code,
      isDeleted: false
    })

    if (existingProvider) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Shipping provider code already exists',
        timestamp: new Date().toISOString()
      })
    }

    const provider = await ShippingProvider.create(providerData)

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Shipping provider created successfully',
      data: { provider },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error creating shipping provider:', error)
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

// Cập nhật đơn vị giao hàng
export const updateProvider = async (req, res) => {
  try {
    const { providerId } = req.params
    const updateData = req.body

    const provider = await ShippingProvider.findOneAndUpdate(
      { _id: providerId, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    )

    if (!provider) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Shipping provider not found',
        timestamp: new Date().toISOString()
      })
    }

    res.json({
      success: true,
      statusCode: 200,
      message: 'Shipping provider updated successfully',
      data: { provider },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating shipping provider:', error)
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

// Xóa đơn vị giao hàng (soft delete)
export const deleteProvider = async (req, res) => {
  try {
    const { providerId } = req.params

    const provider = await ShippingProvider.findOneAndUpdate(
      { _id: providerId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    )

    if (!provider) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Shipping provider not found',
        timestamp: new Date().toISOString()
      })
    }

    res.json({
      success: true,
      statusCode: 200,
      message: 'Shipping provider deleted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deleting shipping provider:', error)
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

// Khôi phục đơn vị giao hàng
export const restoreProvider = async (req, res) => {
  try {
    const { providerId } = req.params

    const provider = await ShippingProvider.findOneAndUpdate(
      { _id: providerId, isDeleted: true },
      { isDeleted: false },
      { new: true }
    )

    if (!provider) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Shipping provider not found or not deleted',
        timestamp: new Date().toISOString()
      })
    }

    res.json({
      success: true,
      statusCode: 200,
      message: 'Shipping provider restored successfully',
      data: { provider },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error restoring shipping provider:', error)
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

// Lấy đơn vị giao hàng mặc định
export const getDefaultProvider = async (req, res) => {
  try {
    const provider = await ShippingProvider.getDefaultProvider()

    if (!provider) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'No default shipping provider found',
        timestamp: new Date().toISOString()
      })
    }

    res.json({
      success: true,
      statusCode: 200,
      message: 'Default shipping provider retrieved successfully',
      data: { provider },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting default shipping provider:', error)
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

// Lấy danh sách đơn vị giao hàng đang hoạt động
export const getActiveProviders = async (req, res) => {
  try {
    const providers = await ShippingProvider.find({
      active: true,
      isDeleted: false
    }).sort({ baseFee: 1 })

    res.json({
      success: true,
      statusCode: 200,
      message: 'Active shipping providers retrieved successfully',
      data: { providers },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting active shipping providers:', error)
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

// API mới: Mô phỏng chọn đơn vị giao hàng cho đơn hàng
export const simulateShippingSelection = async (req, res) => {
  try {
    const { orderAmount, shippingAddress } = req.body

    if (!orderAmount) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Order amount is required',
        timestamp: new Date().toISOString()
      })
    }

    // Lấy tất cả đơn vị giao hàng đang hoạt động
    const activeProviders = await ShippingProvider.find({ 
      active: true, 
      isDeleted: false 
    }).sort({ baseFee: 1 })

    if (activeProviders.length === 0) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'No active shipping providers found',
        timestamp: new Date().toISOString()
      })
    }

    let selectedProvider = null
    let reason = ''

    // Logic chọn đơn vị giao hàng (tương tự như trong OrderService)
    if (orderAmount > 500000) {
      const fastProviders = activeProviders.filter(p => 
        p.estimatedTime && p.estimatedTime.includes('1-2')
      )
      if (fastProviders.length > 0) {
        selectedProvider = fastProviders[0]
        reason = 'Đơn hàng giá trị cao - ưu tiên giao hàng nhanh'
      }
    }

    if (!selectedProvider && orderAmount >= 100000 && orderAmount <= 500000) {
      const balancedProviders = activeProviders.filter(p => 
        p.estimatedTime && (p.estimatedTime.includes('2-3') || p.estimatedTime.includes('2-4'))
      )
      if (balancedProviders.length > 0) {
        selectedProvider = balancedProviders[0]
        reason = 'Đơn hàng giá trị trung bình - chọn đơn vị cân bằng'
      }
    }

    if (!selectedProvider && orderAmount < 100000) {
      selectedProvider = activeProviders[0]
      reason = 'Đơn hàng giá trị thấp - chọn đơn vị tiết kiệm chi phí'
    }

    if (!selectedProvider) {
      selectedProvider = activeProviders[0]
      reason = 'Chọn đơn vị mặc định'
    }

    res.json({
      success: true,
      statusCode: 200,
      message: 'Shipping provider selection simulated successfully',
      data: {
        selectedProvider,
        reason,
        orderAmount,
        allProviders: activeProviders.map(p => ({
          _id: p._id,
          name: p.name,
          code: p.code,
          baseFee: p.baseFee,
          estimatedTime: p.estimatedTime,
          active: p.active
        }))
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error simulating shipping selection:', error)
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}