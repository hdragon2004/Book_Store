import { StatusCodes } from 'http-status-codes'
import userService from '~/services/userService'
import { asyncHandler } from '~/utils/asyncHandler'
import { ApiResponse } from '~/utils/ApiResponse'

/**
 * User Controller - Xử lý các request liên quan đến user
 * Theo Service-Based Architecture: Controller chỉ xử lý request/response
 * Business logic được xử lý trong Service layer
 */

class UserController {
  /**
   * Đăng ký user mới
   * POST /api/v1/users/register
   */
  register = asyncHandler(async (req, res) => {
    const { name, email, password, phone, address } = req.body

    // Gọi service để xử lý đăng ký
    const result = await userService.register({
      name,
      email,
      password,
      phone,
      address
    })

    res.status(StatusCodes.CREATED).json(
      new ApiResponse(
        StatusCodes.CREATED,
        result,
        'User registered successfully'
      )
    )
  })

  /**
   * Đăng nhập user
   * POST /api/v1/users/login
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    // Gọi service để xử lý đăng nhập
    const result = await userService.login({ email, password })

    // Set cookie cho refresh token
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }

    res.cookie('refreshToken', result.refreshToken, options)

    res.status(StatusCodes.OK).json(
      new ApiResponse(
        StatusCodes.OK,
        {
          user: result.user,
          accessToken: result.accessToken
        },
        'Login successful'
      )
    )
  })

  /**
   * Đăng xuất user
   * POST /api/v1/users/logout
   */
  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies

    // Gọi service để xử lý đăng xuất
    await userService.logout(refreshToken)

    // Xóa cookie
    res.clearCookie('refreshToken')

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, null, 'Logout successful')
    )
  })

  /**
   * Refresh access token
   * POST /api/v1/users/refresh-token
   */
  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies

    // Gọi service để refresh token
    const result = await userService.refreshToken(refreshToken)

    res.status(StatusCodes.OK).json(
      new ApiResponse(
        StatusCodes.OK,
        {
          accessToken: result.accessToken
        },
        'Token refreshed successfully'
      )
    )
  })

  /**
   * Lấy thông tin user hiện tại
   * GET /api/v1/users/profile
   */
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id

    // Gọi service để lấy thông tin user
    const user = await userService.getUserById(userId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, { user }, 'Profile retrieved successfully')
    )
  })

  /**
   * Cập nhật thông tin user
   * PUT /api/v1/users/profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const updateData = req.body

    // Gọi service để cập nhật user
    const updatedUser = await userService.updateUser(userId, updateData)

    res.status(StatusCodes.OK).json(
      new ApiResponse(
        StatusCodes.OK,
        { user: updatedUser },
        'Profile updated successfully'
      )
    )
  })

  /**
   * Upload avatar
   * POST /api/v1/users/upload-avatar
   */
  uploadAvatar = asyncHandler(async (req, res) => {
    const userId = req.user._id
    
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json(
        new ApiResponse(
          StatusCodes.BAD_REQUEST,
          null,
          'No avatar file provided'
        )
      )
    }

    // Gọi service để upload avatar
    const updatedUser = await userService.uploadAvatar(userId, req.file)

    res.status(StatusCodes.OK).json(
      new ApiResponse(
        StatusCodes.OK,
        { user: updatedUser },
        'Avatar uploaded successfully'
      )
    )
  })

  /**
   * Đổi mật khẩu
   * PUT /api/v1/users/change-password
   */
  changePassword = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const { currentPassword, newPassword } = req.body

    // Gọi service để đổi mật khẩu
    await userService.changePassword(userId, currentPassword, newPassword)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, null, 'Password changed successfully')
    )
  })

  /**
   * Quên mật khẩu
   * POST /api/v1/users/forgot-password
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body

    // Gọi service để xử lý quên mật khẩu
    await userService.forgotPassword(email)

    res.status(StatusCodes.OK).json(
      new ApiResponse(
        StatusCodes.OK,
        null,
        'Password reset email sent successfully'
      )
    )
  })

  /**
   * Đặt lại mật khẩu
   * POST /api/v1/users/reset-password
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body

    // Gọi service để đặt lại mật khẩu
    await userService.resetPassword(token, newPassword)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, null, 'Password reset successfully')
    )
  })

  /**
   * Xác thực email
   * POST /api/v1/users/verify-email
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body

    // Gọi service để xác thực email
    await userService.verifyEmail(token)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, null, 'Email verified successfully')
    )
  })

  /**
   * Gửi lại email xác thực
   * POST /api/v1/users/resend-verification
   */
  resendVerification = asyncHandler(async (req, res) => {
    const { email } = req.body

    // Gọi service để gửi lại email xác thực
    await userService.resendVerificationEmail(email)

    res.status(StatusCodes.OK).json(
      new ApiResponse(
        StatusCodes.OK,
        null,
        'Verification email sent successfully'
      )
    )
  })

  /**
   * Lấy danh sách user (Admin only)
   * GET /api/v1/users
   */
  getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, role } = req.query

    // Gọi service để lấy danh sách user
    const result = await userService.getUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      role
    })

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'Users retrieved successfully')
    )
  })

  /**
   * Lấy thông tin user theo ID (Admin only)
   * GET /api/v1/users/:id
   */
  getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params

    // Gọi service để lấy thông tin user
    const user = await userService.getUserById(id)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, user, 'User retrieved successfully')
    )
  })

  /**
   * Cập nhật user (Admin only)
   * PUT /api/v1/users/:id
   */
  updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params
    const updateData = req.body

    // Gọi service để cập nhật user
    const updatedUser = await userService.updateUser(id, updateData)

    res.status(StatusCodes.OK).json(
      new ApiResponse(
        StatusCodes.OK,
        updatedUser,
        'User updated successfully'
      )
    )
  })

  /**
   * Xóa user (Admin only)
   * DELETE /api/v1/users/:id
   */
  deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params

    // Gọi service để xóa user
    await userService.deleteUser(id)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, null, 'User deleted successfully')
    )
  })

  /**
   * Cập nhật role của user (Admin only)
   * PATCH /api/users/:id/role
   */
  updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { roleId } = req.body

    const result = await userService.updateUserRole(id, roleId)

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, result, 'User role updated successfully')
    )
  })
}

export default new UserController()
