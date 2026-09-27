const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  razorpayOrderId: { type: String },
  paymentId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
  verificationStatus: { type: String, enum: ['UNVERIFIED', 'VERIFIED'], default: 'UNVERIFIED' },
  refundStatus: { type: String, enum: ['NONE', 'PARTIAL', 'FULL'], default: 'NONE' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

paymentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
