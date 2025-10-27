import mongoose from 'mongoose'
import Voucher from '../models/voucherModel.js'
import VoucherUsage from '../models/voucherUsageModel.js'
import User from '../models/userModel.js'
import dotenv from 'dotenv'

dotenv.config()

async function testGetAvailableVouchersDirect() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore')
    console.log('✅ Connected to MongoDB')

    // Test với user heo (đã dùng SFWSDSADW)
    const user = await User.findOne({ email: 'dra2004p@gmail.com' })
    if (!user) {
      console.log('❌ User heo not found')
      return
    }
    console.log(`👤 Testing with user: ${user.name} (${user.email})`)

    // Lấy tất cả voucher active
    const allVouchers = await Voucher.find({ isActive: true })
    console.log(`\n📊 All active vouchers: ${allVouchers.length}`)
    allVouchers.forEach(v => {
      console.log(`  - ${v.code}: ${v.name}`)
    })

    // Test filtering logic
    const availableVouchers = []
    
    for (const voucher of allVouchers) {
      try {
        const hasUsed = await VoucherUsage.hasUserUsedVoucher(voucher._id, user._id)
        console.log(`\n🎫 Voucher ${voucher.code}:`)
        console.log(`  hasUsed: ${hasUsed}`)
        console.log(`  Will be included: ${!hasUsed}`)
        
        if (!hasUsed) {
          availableVouchers.push(voucher)
        }
      } catch (error) {
        console.log(`❌ Error checking voucher ${voucher.code}: ${error.message}`)
        availableVouchers.push(voucher) // Fallback
      }
    }

    console.log(`\n📋 Available vouchers for user: ${availableVouchers.length}`)
    availableVouchers.forEach(v => {
      console.log(`  ✅ ${v.code}: ${v.name}`)
    })

    // Test với user khác (chưa dùng SFWSDSADW)
    const adminUser = await User.findOne({ email: 'admin@bookstore.com' })
    console.log(`\n👤 Testing with admin user: ${adminUser.name}`)
    
    const adminAvailableVouchers = []
    for (const voucher of allVouchers) {
      const hasUsed = await VoucherUsage.hasUserUsedVoucher(voucher._id, adminUser._id)
      if (!hasUsed) {
        adminAvailableVouchers.push(voucher)
      }
    }
    
    console.log(`📋 Available vouchers for admin: ${adminAvailableVouchers.length}`)
    adminAvailableVouchers.forEach(v => {
      console.log(`  ✅ ${v.code}: ${v.name}`)
    })

    await mongoose.disconnect()
    console.log('\n✅ Test completed')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

testGetAvailableVouchersDirect()
