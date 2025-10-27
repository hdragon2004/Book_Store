import mongoose from 'mongoose'
import Voucher from '../models/voucherModel.js'
import VoucherUsage from '../models/voucherUsageModel.js'
import User from '../models/userModel.js'
import Order from '../models/orderModel.js'
import dotenv from 'dotenv'

dotenv.config()

async function checkRealVoucherUsage() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore')
    console.log('✅ Connected to MongoDB')

    // 1. Kiểm tra tất cả VoucherUsage records
    console.log('\n📋 ALL VOUCHER USAGE RECORDS:')
    console.log('='.repeat(60))
    const allUsages = await VoucherUsage.find({})
      .populate('voucherId', 'code name')
      .populate('userId', 'name email')
      .populate('orderId', 'orderCode status')
      .sort({ usedAt: -1 })

    if (allUsages.length === 0) {
      console.log('❌ No VoucherUsage records found in database')
    } else {
      allUsages.forEach((usage, index) => {
        console.log(`\nRecord ${index + 1}:`)
        console.log(`  ID: ${usage._id}`)
        console.log(`  Voucher: ${usage.voucherId?.code} (${usage.voucherId?.name})`)
        console.log(`  User: ${usage.userId?.name} (${usage.userId?.email})`)
        console.log(`  Order: ${usage.orderId?.orderCode} (${usage.orderId?.status})`)
        console.log(`  Used At: ${usage.usedAt}`)
        console.log(`  Refunded: ${usage.isRefunded}`)
        console.log(`  Discount: ${usage.discountAmount?.toLocaleString('vi-VN')} ₫`)
      })
    }

    // 2. Kiểm tra tất cả users
    console.log('\n👥 ALL USERS:')
    console.log('='.repeat(40))
    const users = await User.find({}).select('_id name email')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ID: ${user._id}`)
    })

    // 3. Kiểm tra tất cả vouchers
    console.log('\n🎫 ALL VOUCHERS:')
    console.log('='.repeat(40))
    const vouchers = await Voucher.find({}).select('_id code name isActive usedCount')
    vouchers.forEach((voucher, index) => {
      console.log(`${index + 1}. ${voucher.code} (${voucher.name}) - Active: ${voucher.isActive} - Used: ${voucher.usedCount}`)
    })

    // 4. Kiểm tra tất cả orders
    console.log('\n📦 ALL ORDERS:')
    console.log('='.repeat(40))
    const orders = await Order.find({}).select('_id orderCode userId voucherId totalPrice status').populate('userId', 'name email')
    if (orders.length === 0) {
      console.log('❌ No orders found in database')
    } else {
      orders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.orderCode} - User: ${order.userId?.name} - Voucher: ${order.voucherId ? 'YES' : 'NO'} - Total: ${order.totalPrice?.toLocaleString('vi-VN')} ₫ - Status: ${order.status}`)
      })
    }

    // 5. Test hasUserUsedVoucher cho từng user-voucher combination
    console.log('\n🧪 TESTING hasUserUsedVoucher FOR ALL COMBINATIONS:')
    console.log('='.repeat(60))
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.name}`)
      for (const voucher of vouchers) {
        const hasUsed = await VoucherUsage.hasUserUsedVoucher(voucher._id, user._id)
        console.log(`  🎫 ${voucher.code}: ${hasUsed ? '❌ USED' : '✅ Available'}`)
      }
    }

    // 6. Test getAvailableVouchers cho user đầu tiên
    if (users.length > 0) {
      const testUser = users[0]
      console.log(`\n🔍 TESTING getAvailableVouchers FOR USER: ${testUser.name}`)
      console.log('='.repeat(60))
      
      const activeVouchers = await Voucher.find({ isActive: true })
      const availableVouchers = []
      
      for (const voucher of activeVouchers) {
        const hasUsed = await VoucherUsage.hasUserUsedVoucher(voucher._id, testUser._id)
        if (!hasUsed) {
          availableVouchers.push(voucher)
        }
      }
      
      console.log(`Total active vouchers: ${activeVouchers.length}`)
      console.log(`Available for user: ${availableVouchers.length}`)
      console.log('\nAvailable vouchers:')
      availableVouchers.forEach(v => {
        console.log(`  ✅ ${v.code}: ${v.name}`)
      })
    }

    await mongoose.disconnect()
    console.log('\n✅ Check completed')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkRealVoucherUsage()
