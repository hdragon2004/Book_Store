import Role from '~/models/roleModel'

/**
 * Role Service - Quản lý roles và phân quyền
 */
class RoleService {
  /**
   * Đảm bảo các role cơ bản tồn tại
   */
  async ensureBasicRoles() {
    try {
      const basicRoles = [
        {
          name: 'admin',
          description: 'Administrator role - Full system access'
        },
        {
          name: 'user', 
          description: 'Regular user role - Basic user access'
        },
        {
          name: 'staff',
          description: 'Staff role - Book management, order management, and customer support'
        }
      ]

      for (const roleData of basicRoles) {
        const existingRole = await Role.findOne({ name: roleData.name })
        if (!existingRole) {
          await Role.create(roleData)
          console.log(`✅ Created role: ${roleData.name}`)
        }
        // Không log khi role đã tồn tại
      }

    } catch (error) {
      console.error('❌ Error ensuring basic roles:', error.message)
      throw error
    }
  }

  /**
   * Lấy tất cả roles
   */
  async getAllRoles() {
    return await Role.findActive().sort({ createdAt: 1 })
  }

  /**
   * Lấy role theo tên
   */
  async getRoleByName(name) {
    return await Role.findOne({ name, isDeleted: false })
  }

  /**
   * Tạo role mới
   */
  async createRole(roleData) {
    const role = new Role(roleData)
    return await role.save()
  }

  /**
   * Cập nhật role
   */
  async updateRole(roleId, updateData) {
    return await Role.findByIdAndUpdate(
      roleId, 
      { ...updateData, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    )
  }

  /**
   * Xóa role (soft delete)
   */
  async deleteRole(roleId) {
    const role = await Role.findById(roleId)
    if (!role) {
      throw new Error('Role not found')
    }
    return await role.softDelete()
  }

  /**
   * Khôi phục role đã xóa
   */
  async restoreRole(roleId) {
    const role = await Role.findById(roleId)
    if (!role) {
      throw new Error('Role not found')
    }
    return await role.restore()
  }

  /**
   * Tìm kiếm roles
   */
  async searchRoles(query) {
    return await Role.searchRoles(query)
  }
}

export default new RoleService()
