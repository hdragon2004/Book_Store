import { AppError } from '~/utils/AppError.js'

/**
 * Middleware phân quyền theo roles
 * @param {...string} roles - Các role được phép truy cập
 * @returns {Function} Middleware function
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Kiểm tra xem user đã được authenticate chưa
    if (!req.user) {
      return next(new AppError('Authentication required', 401))
    }

    // Kiểm tra xem user có role được phép không
    const userRole = req.user.roleId?.name || req.user.role
    
    if (!userRole) {
      return next(new AppError('User role not found', 403))
    }

    if (!roles.includes(userRole)) {
      return next(new AppError(
        `Access denied. Required roles: ${roles.join(', ')}. Your role: ${userRole}`, 
        403
      ))
    }

    next()
  }
}

/**
 * Middleware kiểm tra quyền admin
 */
export const requireAdmin = authorizeRoles('admin')

/**
 * Middleware kiểm tra quyền admin hoặc staff
 */
export const requireAdminOrStaff = authorizeRoles('admin', 'staff')

/**
 * Middleware kiểm tra quyền staff trở lên (staff, admin)
 */
export const requireStaffOrAbove = authorizeRoles('staff', 'admin')

/**
 * Middleware kiểm tra quyền user trở lên (user, staff, admin)
 */
export const requireUserOrAbove = authorizeRoles('user', 'staff', 'admin')
