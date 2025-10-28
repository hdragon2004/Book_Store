import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  transactionCode: {
    type: String,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  method: {
    type: String,
    enum: ['cod', 'vnpay', 'momo', 'zalopay', 'paypal', 'credit_card', 'bank_transfer'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  gatewayResponse: {
    type: Object
  },
  paymentUrl: {
    type: String
  },
  description: {
    type: String,
    trim: true
  },
  customerInfo: {
    ipAddress: String,
    userAgent: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware: Tự động sinh transactionCode trước khi lưu
paymentSchema.pre('save', async function (next) {
  if (this.transactionCode) return next();

  const date = new Date();
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '');

  // Đếm số giao dịch đã tạo trong ngày
  const count = await mongoose.model('Payment').countDocuments({
    createdAt: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    }
  });

  this.transactionCode = `PAY-${yyyymmdd}-${String(count + 1).padStart(3, '0')}`;
  next();
});

// Middleware: Cập nhật updatedAt trước khi save
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ method: 1 });
paymentSchema.index({ createdAt: -1 });

// Static method: Tìm payment theo transactionCode
paymentSchema.statics.findByTransactionCode = function(transactionCode) {
  return this.findOne({ transactionCode });
};

// Static method: Lấy payments theo orderId
paymentSchema.statics.findByOrderId = function(orderId) {
  return this.find({ orderId }).sort({ createdAt: -1 });
};

// Static method: Lấy payments theo status
paymentSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Instance method: Cập nhật status
paymentSchema.methods.updateStatus = function(status, transactionId = null, gatewayResponse = null) {
  this.status = status;
  if (transactionId) this.transactionId = transactionId;
  if (gatewayResponse) this.gatewayResponse = gatewayResponse;
  this.updatedAt = new Date();
  return this.save();
};

export default mongoose.model('Payment', paymentSchema);
