import jwt from 'jsonwebtoken'
import { StatusCodes } from 'http-status-codes'
import User from '~/models/userModel'
import { config } from '~/config/environment'

// Middleware to verify JWT token
export const authenticate = async (req, res, next) => {
  try {
    let token

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }
    
    // Check for token in cookies (for web applications)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token
    }

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Access denied. No token provided.'
      })
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret)
    
    // Get user from token with populated role
    const user = await User.findById(decoded.userId)
      .select('-password')
      .populate('roleId', 'name')
    
    if (!user || user.isDeleted) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Token is not valid or user not found.'
      })
    }

    req.user = user
    req.userRole = user.roleId?.name || 'user' // Set user role for role-based access
    next()
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Token is not valid.'
    })
  }
}

// Middleware to check if user is admin
export const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Access denied. Please authenticate first.'
        })
      }

      // Get user with role details (if role is populated)
      const user = await User.findById(req.user._id).populate('roleId')
      
      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not found'
        })
      }

      // Check if user role is in allowed roles
      const userRole = user.roleId?.name || user.roleId
      if (!roles.includes(userRole)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${userRole}`
        })
      }

      // Add role info to request
      req.userRole = userRole
      next()
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Authorization error'
      })
    }
  }
}

// Async handler wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
