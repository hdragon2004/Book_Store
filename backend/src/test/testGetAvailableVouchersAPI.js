import mongoose from 'mongoose'
import Voucher from '../models/voucherModel.js'
import VoucherUsage from '../models/voucherUsageModel.js'
import User from '../models/userModel.js'
import dotenv from 'dotenv'

dotenv.config()

async function testGetAvailableVouchersAPI() {
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

    // Simulate getAvailableVouchers logic
    const result = await voucherService.getVouchers({
      isActive: true,
      limit: 50
    })

    console.log(`\n📊 All active vouchers: ${result.vouchers.length}`)
    result.vouchers.forEach(v => {
      console.log(`  - ${v.code}: ${v.name}`)
    })

    // Filter logic
    const availableVouchers = []
    
    for (const voucher of result.vouchers) {
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

    await mongoose.disconnect()
    console.log('\n✅ Test completed')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Import voucherService
import voucherService from '../services/voucherService.js'

testGetAvailableVouchersAPI()
