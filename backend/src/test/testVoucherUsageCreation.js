import mongoose from 'mongoose'
import Voucher from '../models/voucherModel.js'
import VoucherUsage from '../models/voucherUsageModel.js'
import User from '../models/userModel.js'
import Order from '../models/orderModel.js'
import dotenv from 'dotenv'

dotenv.config()

async function testVoucherUsageCreation() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore')
    console.log('✅ Connected to MongoDB')

    // 1. Lấy user để test
    const user = await User.findOne({}).select('_id name email')
    if (!user) {
      console.log('❌ No users found')
      return
    }
    console.log(`👤 Testing with user: ${user.name} (${user.email})`)

    // 2. Lấy voucher để test
    const voucher = await Voucher.findOne({ isActive: true }).select('_id code name')
    if (!voucher) {
      console.log('❌ No active vouchers found')
      return
    }
    console.log(`🎫 Testing with voucher: ${voucher.code} (${voucher.name})`)

    // 3. Kiểm tra trước khi tạo usage
    console.log('\n📋 BEFORE creating usage:')
    const beforeUsage = await VoucherUsage.hasUserUsedVoucher(voucher._id, user._id)
    console.log(`User has used voucher: ${beforeUsage ? 'YES' : 'NO'}`)

    // 4. Tạo một order giả để test
    const fakeOrder = await Order.create({
      orderCode: `TEST_${Date.now()}`,
      userId: user._id,
      totalPrice: 100000,
      originalAmount: 100000,
      discountAmount: 0,
      shippingAddressId: new mongoose.Types.ObjectId(),
      paymentMethod: 'cod',
      status: 'pending'
    })
    console.log(`📦 Created fake order: ${fakeOrder._id}`)

    // 5. Tạo VoucherUsage record
    const voucherUsage = await VoucherUsage.create({
      voucherId: voucher._id,
      userId: user._id,
      orderId: fakeOrder._id,
      voucherCode: voucher.code,
      discountAmount: 10000,
      orderAmount: 100000
    })
    console.log(`✅ Created VoucherUsage record: ${voucherUsage._id}`)

    // 6. Kiểm tra sau khi tạo usage
    console.log('\n📋 AFTER creating usage:')
    const afterUsage = await VoucherUsage.hasUserUsedVoucher(voucher._id, user._id)
    console.log(`User has used voucher: ${afterUsage ? 'YES' : 'NO'}`)

    // 7. Test getAvailableVouchers logic
    console.log('\n🔍 Testing getAvailableVouchers filtering:')
    const allVouchers = await Voucher.find({ isActive: true })
    console.log(`Total active vouchers: ${allVouchers.length}`)
    
    const availableVouchers = []
    for (const v of allVouchers) {
      const hasUsedThisVoucher = await VoucherUsage.hasUserUsedVoucher(v._id, user._id)
      console.log(`Voucher ${v.code}: hasUsed = ${hasUsedThisVoucher}`)
      if (!hasUsedThisVoucher) {
        availableVouchers.push(v)
      }
    }
    
    console.log(`\n📊 Available vouchers for user: ${availableVouchers.length}`)
    availableVouchers.forEach(v => {
      console.log(`  ✅ ${v.code}: ${v.name}`)
    })

    // 8. Kiểm tra voucher đã sử dụng
    const usedVouchers = []
    for (const v of allVouchers) {
      const hasUsedThisVoucher = await VoucherUsage.hasUserUsedVoucher(v._id, user._id)
      if (hasUsedThisVoucher) {
        usedVouchers.push(v)
      }
    }
    
    console.log(`\n🚫 Used vouchers (should be hidden): ${usedVouchers.length}`)
    usedVouchers.forEach(v => {
      console.log(`  ❌ ${v.code}: ${v.name}`)
    })

    // 9. Test API endpoint logic
    console.log('\n🌐 Testing API endpoint logic:')
    const VoucherUsageImport = (await import('../models/voucherUsageModel.js')).default
    const availableVouchersAPI = []
    
    for (const v of allVouchers) {
      try {
        const hasUsed = await VoucherUsageImport.hasUserUsedVoucher(v._id, user._id)
        if (!hasUsed) {
          availableVouchersAPI.push(v)
        }
      } catch (error) {
        console.log(`Error checking voucher ${v.code}: ${error.message}`)
        availableVouchersAPI.push(v) // Fallback
      }
    }
    
    console.log(`API would return ${availableVouchersAPI.length} vouchers`)

    // 10. Cleanup - xóa test data
    console.log('\n🧹 Cleaning up test data...')
    await VoucherUsage.findByIdAndDelete(voucherUsage._id)
    await Order.findByIdAndDelete(fakeOrder._id)
    console.log('✅ Cleanup completed')

    await mongoose.disconnect()
    console.log('\n✅ Test completed successfully')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testVoucherUsageCreation()
