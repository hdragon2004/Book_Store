import User from '~/models/userModel'
import Role from '~/models/roleModel'

/**
 * Helper function để xác định người nhận (toId) từ conversationId và người gửi (fromId)
 * @param {string} conversationId - ID của cuộc trò chuyện (format: "userId1_userId2")
 * @param {string} fromId - ID của người gửi
 * @returns {Promise<string|null>} - ID của người nhận hoặc null nếu không tìm thấy
 */
export const getReceiverId = async (conversationId, fromId) => {
  try {
    // Parse conversationId để lấy danh sách user IDs
    const userIds = conversationId.split('_')
    
    if (userIds.length !== 2) {
      console.error('❌ Invalid conversationId format:', conversationId)
      return null
    }
    
    // Tìm user ID khác fromId
    const receiverId = userIds.find(id => id !== fromId.toString())
    
    if (!receiverId) {
      console.error('❌ Could not find receiver in conversation:', conversationId, 'fromId:', fromId)
      return null
    }
    
    // Validate receiver exists
    const receiver = await User.findById(receiverId)
    if (!receiver) {
      console.error('❌ Receiver user not found:', receiverId)
      return null
    }
    
    return receiverId
    
  } catch (error) {
    console.error('❌ Error in getReceiverId:', error)
    return null
  }
}

/**
 * Helper function để xác định staff user ID (người hỗ trợ)
 * @returns {Promise<string|null>} - ID của staff user hoặc null nếu không tìm thấy
 */
export const getStaffUserId = async () => {
  try {
    const staffRole = await Role.findOne({ name: 'staff' })
    if (!staffRole) {
      console.error('❌ Staff role not found')
      return null
    }
    
    const staffUser = await User.findOne({ roleId: staffRole._id })
    if (!staffUser) {
      console.error('❌ Staff user not found')
      return null
    }
    
    return staffUser._id.toString()
    
  } catch (error) {
    console.error('❌ Error in getStaffUserId:', error)
    return null
  }
}

/**
 * Helper function để xác định admin user ID (backup)
 * @returns {Promise<string|null>} - ID của admin user hoặc null nếu không tìm thấy
 */
export const getAdminUserId = async () => {
  try {
    const adminRole = await Role.findOne({ name: 'admin' })
    if (!adminRole) {
      console.error('❌ Admin role not found')
      return null
    }
    
    const adminUser = await User.findOne({ roleId: adminRole._id })
    if (!adminUser) {
      console.error('❌ Admin user not found')
      return null
    }
    
    return adminUser._id.toString()
    
  } catch (error) {
    console.error('❌ Error in getAdminUserId:', error)
    return null
  }
}

/**
 * Helper function để xác định toId dựa trên role của người gửi
 * @param {string} conversationId - ID của cuộc trò chuyện
 * @param {string} fromId - ID của người gửi
 * @param {string} senderRole - Role của người gửi ('admin', 'staff' hoặc 'user')
 * @returns {Promise<string|null>} - ID của người nhận
 */
export const determineReceiverId = async (conversationId, fromId, senderRole) => {
  try {
    if (senderRole === 'admin' || senderRole === 'staff') {
      // Admin/Staff gửi cho user - lấy user ID từ conversationId
      return await getReceiverId(conversationId, fromId)
    } else {
      // User gửi cho staff - lấy staff ID (ưu tiên staff, fallback admin)
      const staffId = await getStaffUserId()
      if (staffId) {
        return staffId
      }
      // Fallback to admin nếu không có staff
      return await getAdminUserId()
    }
  } catch (error) {
    console.error('❌ Error in determineReceiverId:', error)
    return null
  }
}

/**
 * Helper function để validate message data trước khi lưu
 * @param {Object} messageData - Dữ liệu tin nhắn
 * @returns {Object} - Dữ liệu đã được validate và bổ sung toId nếu cần
 */
export const validateAndEnhanceMessageData = async (messageData) => {
  const { conversationId, fromId, content, messageType = 'text', imageUrl } = messageData
  
  // Validate required fields
  if (!conversationId || !fromId || !content) {
    throw new Error('Missing required fields: conversationId, fromId, content')
  }
  
  // Get sender role
  const sender = await User.findById(fromId).populate('roleId', 'name')
  if (!sender) {
    throw new Error('Sender not found')
  }
  
  const senderRole = sender.roleId?.name || 'user'
  
  // Determine toId
  const toId = await determineReceiverId(conversationId, fromId, senderRole)
  
  if (!toId) {
    throw new Error('Could not determine receiver')
  }
  
  return {
    conversationId,
    fromId,
    toId,
    content,
    messageType,
    imageUrl: imageUrl || null,
    isRead: false,
    isDeleted: false
  }
}
 