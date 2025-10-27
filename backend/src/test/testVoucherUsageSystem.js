import mongoose from 'mongoose'
import Voucher from '../models/voucherModel.js'
import VoucherUsage from '../models/voucherUsageModel.js'
import User from '../models/userModel.js'
import dotenv from 'dotenv'

dotenv.config()

async function testVoucherUsageSystem() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore')
    console.log('✅ Connected to MongoDB')

    // 1. Lấy một user để test
    const user = await User.findOne({}).select('_id name email')
    if (!user) {
      console.log('❌ No users found in database')
      return
    }
    console.log(`👤 Testing with user: ${user.name} (${user.email})`)

    // 2. Lấy một voucher để test
    const voucher = await Voucher.findOne({ isActive: true }).select('_id code name')
    if (!voucher) {
      console.log('❌ No active vouchers found in database')
      return
    }
    console.log(`🎫 Testing with voucher: ${voucher.code} (${voucher.name})`)

    // 3. Test hasUserUsedVoucher method
    console.log('\n🧪 Testing hasUserUsedVoucher method...')
    const hasUsed = await VoucherUsage.hasUserUsedVoucher(voucher._id, user._id)
    console.log(`Result: User ${user.name} has used voucher ${voucher.code}: ${hasUsed ? 'YES' : 'NO'}`)

    // 4. Kiểm tra VoucherUsage records
    console.log('\n📋 Checking VoucherUsage records...')
    const usageRecords = await VoucherUsage.find({
      voucherId: voucher._id,
      userId: user._id
    })
    console.log(`Found ${usageRecords.length} usage records for this user-voucher combination`)
    
    if (usageRecords.length > 0) {
      usageRecords.forEach((record, index) => {
        console.log(`  Record ${index + 1}:`)
        console.log(`    Order ID: ${record.orderId}`)
        console.log(`    Used At: ${record.usedAt}`)
        console.log(`    Refunded: ${record.isRefunded}`)
        console.log(`    Discount: ${record.discountAmount?.toLocaleString('vi-VN')} ₫`)
      })
    }

    // 5. Test getAvailableVouchers logic
    console.log('\n🔍 Testing getAvailableVouchers filtering logic...')
    const allVouchers = await Voucher.find({ isActive: true }).limit(5)
    console.log(`Total active vouchers: ${allVouchers.length}`)
    
    const availableVouchers = []
    for (const v of allVouchers) {
      const hasUsedThisVoucher = await VoucherUsage.hasUserUsedVoucher(v._id, user._id)
      if (!hasUsedThisVoucher) {
        availableVouchers.push(v)
      }
    }
    console.log(`Available vouchers for user: ${availableVouchers.length}`)
    
    console.log('\n📊 Available vouchers:')
    availableVouchers.forEach(v => {
      console.log(`  - ${v.code}: ${v.name}`)
    })

    // 6. Test voucherService.applyVoucher logic
    console.log('\n⚙️ Testing voucherService.applyVoucher logic...')
    try {
      // Simulate applyVoucher check
      const hasUsedInService = await VoucherUsage.hasUserUsedVoucher(voucher._id, user._id)
      if (hasUsedInService) {
        console.log(`❌ Voucher ${voucher.code} would be rejected: "You have already used this voucher"`)
      } else {
        console.log(`✅ Voucher ${voucher.code} would be accepted`)
      }
    } catch (error) {
      console.log(`❌ Error testing applyVoucher: ${error.message}`)
    }

    await mongoose.disconnect()
    console.log('\n✅ Test completed successfully')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

testVoucherUsageSystem()
