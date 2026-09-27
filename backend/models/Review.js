const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

reviewSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Ensure one review per booking
reviewSchema.index({ bookingId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
