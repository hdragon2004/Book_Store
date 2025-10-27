import mongoose from 'mongoose'
import Voucher from '../models/voucherModel.js'
import VoucherUsage from '../models/voucherUsageModel.js'
import User from '../models/userModel.js'
import Order from '../models/orderModel.js'
import dotenv from 'dotenv'

dotenv.config()

async function checkVoucherUsage() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // 1. Lấy tất cả voucher
    const vouchers = await Voucher.find({}).select('_id code name isActive usedCount')
    console.log('\n📊 VOUCHERS:')
    console.log('='.repeat(50))
    vouchers.forEach(voucher => {
      console.log(`ID: ${voucher._id}`)
      console.log(`Code: ${voucher.code}`)
      console.log(`Name: ${voucher.name}`)
      console.log(`Active: ${voucher.isActive}`)
      console.log(`Used Count: ${voucher.usedCount}`)
      console.log('-'.repeat(30))
    })

    // 2. Lấy tất cả voucher usage
    const usages = await VoucherUsage.find({})
      .populate('voucherId', 'code name')
      .populate('userId', 'name email')
      .populate('orderId', 'orderCode status')
      .sort({ usedAt: -1 })

    console.log('\n📋 VOUCHER USAGE RECORDS:')
    console.log('='.repeat(80))
    usages.forEach(usage => {
      console.log(`Usage ID: ${usage._id}`)
      console.log(`Voucher: ${usage.voucherId?.code} (${usage.voucherId?.name})`)
      console.log(`User: ${usage.userId?.name} (${usage.userId?.email})`)
      console.log(`Order: ${usage.orderId?.orderCode} (${usage.orderId?.status})`)
      console.log(`Voucher Code: ${usage.voucherCode}`)
      console.log(`Discount Amount: ${usage.discountAmount?.toLocaleString('vi-VN')} ₫`)
      console.log(`Order Amount: ${usage.orderAmount?.toLocaleString('vi-VN')} ₫`)
      console.log(`Used At: ${usage.usedAt}`)
      console.log(`Refunded: ${usage.isRefunded}`)
      if (usage.isRefunded) {
        console.log(`Refunded At: ${usage.refundedAt}`)
        console.log(`Refund Reason: ${usage.refundReason}`)
      }
      console.log('-'.repeat(50))
    })

    // 3. Thống kê theo voucher
    console.log('\n📈 VOUCHER USAGE STATISTICS:')
    console.log('='.repeat(60))
    
    for (const voucher of vouchers) {
      const stats = await VoucherUsage.getUsageStats(voucher._id)
      const usageCount = stats[0]?.totalUsage || 0
      const refundedCount = stats[0]?.refundedUsage || 0
      const activeUsage = usageCount - refundedCount
      
      console.log(`Voucher: ${voucher.code} (${voucher.name})`)
      console.log(`Total Usage: ${usageCount}`)
      console.log(`Active Usage: ${activeUsage}`)
      console.log(`Refunded: ${refundedCount}`)
      console.log(`Voucher Used Count: ${voucher.usedCount}`)
      console.log(`Match: ${voucher.usedCount === activeUsage ? '✅' : '❌'}`)
      console.log('-'.repeat(40))
    }

    // 4. Kiểm tra user đã sử dụng voucher nào
    const users = await User.find({}).select('_id name email')
    console.log('\n👥 USER VOUCHER USAGE:')
    console.log('='.repeat(60))
    
    for (const user of users) {
      const userUsages = await VoucherUsage.find({ 
        userId: user._id, 
        isRefunded: false 
      }).populate('voucherId', 'code name')
      
      console.log(`User: ${user.name} (${user.email})`)
      console.log(`Used Vouchers: ${userUsages.length}`)
      
      if (userUsages.length > 0) {
        userUsages.forEach(usage => {
          console.log(`  - ${usage.voucherId?.code} (${usage.voucherId?.name}) - ${usage.usedAt}`)
        })
      }
      console.log('-'.repeat(40))
    }

    // 5. Test hasUserUsedVoucher method
    console.log('\n🧪 TESTING hasUserUsedVoucher METHOD:')
    console.log('='.repeat(60))
    
    if (usages.length > 0) {
      const testUsage = usages[0]
      const hasUsed = await VoucherUsage.hasUserUsedVoucher(
        testUsage.voucherId._id, 
        testUsage.userId._id
      )
      console.log(`Test: User ${testUsage.userId.name} used voucher ${testUsage.voucherId.code}`)
      console.log(`Result: ${hasUsed ? '✅ Yes' : '❌ No'}`)
    }

    await mongoose.disconnect()
    console.log('\n✅ Disconnected from MongoDB')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkVoucherUsage()
