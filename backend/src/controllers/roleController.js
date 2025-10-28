import { AppError } from '~/utils/AppError'
import roleService from '~/services/roleService'

/**
 * Role Controller - Xử lý các request liên quan đến roles
 */
class RoleController {
  /**
   * Lấy tất cả roles
   */
  async getAllRoles(req, res, next) {
    try {
      const roles = await roleService.getAllRoles()
      
      res.status(200).json({
        success: true,
        message: 'Roles retrieved successfully',
        data: roles
      })
    } catch (error) {
      next(new AppError(error.message, 500))
    }
  }

  /**
   * Lấy role theo ID
   */
  async getRoleById(req, res, next) {
    try {
      const { roleId } = req.params
      const role = await roleService.getRoleByName(roleId) // Tìm theo name thay vì ID
      
      if (!role) {
        return next(new AppError('Role not found', 404))
      }

      res.status(200).json({
        success: true,
        message: 'Role retrieved successfully',
        data: role
      })
    } catch (error) {
      next(new AppError(error.message, 500))
    }
  }

  /**
   * Tạo role mới
   */
  async createRole(req, res, next) {
    try {
      const { name, description } = req.body

      // Kiểm tra role đã tồn tại chưa
      const existingRole = await roleService.getRoleByName(name)
      if (existingRole) {
        return next(new AppError('Role already exists', 400))
      }

      const role = await roleService.createRole({
        name,
        description
      })

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role
      })
    } catch (error) {
      next(new AppError(error.message, 500))
    }
  }

  /**
   * Cập nhật role
   */
  async updateRole(req, res, next) {
    try {
      const { roleId } = req.params
      const updateData = req.body

      const role = await roleService.updateRole(roleId, updateData)
      if (!role) {
        return next(new AppError('Role not found', 404))
      }

      res.status(200).json({
        success: true,
        message: 'Role updated successfully',
        data: role
      })
    } catch (error) {
      next(new AppError(error.message, 500))
    }
  }

  /**
   * Xóa role (soft delete)
   */
  async deleteRole(req, res, next) {
    try {
      const { roleId } = req.params

      const role = await roleService.deleteRole(roleId)
      if (!role) {
        return next(new AppError('Role not found', 404))
      }

      res.status(200).json({
        success: true,
        message: 'Role deleted successfully'
      })
    } catch (error) {
      next(new AppError(error.message, 500))
    }
  }

  /**
   * Khôi phục role đã xóa
   */
  async restoreRole(req, res, next) {
    try {
      const { roleId } = req.params

      const role = await roleService.restoreRole(roleId)
      if (!role) {
        return next(new AppError('Role not found', 404))
      }

      res.status(200).json({
        success: true,
        message: 'Role restored successfully',
        data: role
      })
    } catch (error) {
      next(new AppError(error.message, 500))
    }
  }

  /**
   * Tìm kiếm roles
   */
  async searchRoles(req, res, next) {
    try {
      const { q } = req.query

      if (!q) {
        return next(new AppError('Search query is required', 400))
      }

      const roles = await roleService.searchRoles(q)

      res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: roles
      })
    } catch (error) {
      next(new AppError(error.message, 500))
    }
  }
}

export default new RoleController()
