import express from 'express'
import {
  getItemsByOrder,
  getAllItems,
  getOrderItem,
  updateOrderItem,
  deleteOrderItem
} from '~/controllers/orderItemController'
import { authenticate, authorize } from '~/middlewares/authMiddleware'

const router = express.Router()

// @route   GET /api/order-items/order/:orderId
// @desc    Get order items by order ID
// @access  Private
router.get('/order/:orderId', authenticate, getItemsByOrder)

// @route   GET /api/order-items/:id
// @desc    Get single order item
// @access  Private
router.get('/:id', authenticate, getOrderItem)

// @route   PUT /api/order-items/:id
// @desc    Update order item quantity
// @access  Private
router.put('/:id', authenticate, updateOrderItem)

// @route   DELETE /api/order-items/:id
// @desc    Delete order item
// @access  Private
router.delete('/:id', authenticate, deleteOrderItem)

// @route   GET /api/order-items
// @desc    Get all order items (Admin)
// @access  Private/Admin
router.get('/', authenticate, authorize('admin'), getAllItems)

export default router
