const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },

  // Pricing model
  pricingType: {
    type: String,
    enum: ['fixed', 'inspection', 'hourly'],
    required: true,
  },

  // Fixed pricing — complete service price
  fixedPrice: { type: Number },

  // Inspection/Quote pricing — upfront visit/inspection fee
  inspectionFee: { type: Number },

  // Hourly pricing
  visitFee: { type: Number },
  hourlyRate: { type: Number },
  billingIncrement: { type: Number, default: 60 }, // minutes: 30 or 60

  // Auto-computed base price for sorting & backward compat
  basePrice: { type: Number, required: true },

  image: { type: String },
  isActive: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

// Validate pricing fields and auto-compute basePrice before validation
serviceSchema.pre('validate', function (next) {
  // Reject negative values
  const numFields = ['fixedPrice', 'inspectionFee', 'visitFee', 'hourlyRate', 'billingIncrement'];
  for (const field of numFields) {
    if (this[field] != null && this[field] < 0) {
      return next(new Error(`${field} cannot be negative.`));
    }
  }

  if (this.pricingType === 'fixed') {
    if (!this.fixedPrice || this.fixedPrice <= 0) {
      return next(new Error('Fixed price is required and must be greater than 0.'));
    }
    this.basePrice = this.fixedPrice;
  } else if (this.pricingType === 'inspection') {
    if (!this.inspectionFee || this.inspectionFee <= 0) {
      return next(new Error('Inspection/visit fee is required and must be greater than 0.'));
    }
    this.basePrice = this.inspectionFee;
  } else if (this.pricingType === 'hourly') {
    if (!this.visitFee || this.visitFee <= 0) {
      return next(new Error('Visit fee is required and must be greater than 0.'));
    }
    if (!this.hourlyRate || this.hourlyRate <= 0) {
      return next(new Error('Hourly rate is required and must be greater than 0.'));
    }
    if (this.billingIncrement && ![30, 60].includes(this.billingIncrement)) {
      return next(new Error('Billing increment must be 30 or 60 minutes.'));
    }
    this.basePrice = this.visitFee;
  }

  next();
});

module.exports = mongoose.model('Service', serviceSchema);
