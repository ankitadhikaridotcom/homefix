const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Auto-generated friendly ID like HF1001
  bookingId: { type: String, unique: true },

  // Service info (might be null if it's a completely custom service without a base Service model)
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  serviceName: { type: String, required: true },
  serviceCategory: { type: String },
  serviceImage: { type: String },

  // Link to custom request if this booking originated from one
  customRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomServiceRequest' },

  // Customer info
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String },

  // Provider info
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerName: { type: String, required: true },

  // Booking details
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: Number, default: 1 },
  description: { type: String },

  // Address & Location Snapshot
  address: {
    formattedAddress: { type: String },
    street: { type: String },
    locality: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    landmark: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  serviceLocation: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] } // [longitude, latitude]
  },

  // ---- Pricing Model ----
  pricingType: { type: String, enum: ['fixed', 'inspection', 'hourly'], default: 'fixed' },

  // Common pricing fields
  visitCharge: { type: Number, default: 0 },
  labourCharge: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  total: { type: Number, required: true },

  // Initial payment (what customer pays at booking)
  initialPayment: { type: Number, default: 0 },
  // Final settled amount (after quote or hourly calc)
  finalTotal: { type: Number },

  // ---- Inspection/Quote workflow ----
  quote: {
    labourCharge: { type: Number },
    partsCharge: { type: Number, default: 0 },
    additionalCharge: { type: Number, default: 0 },
    description: { type: String },
    total: { type: Number },
    status: { type: String, enum: ['pending', 'approved', 'rejected'] },
    createdAt: { type: Date },
  },

  // ---- Hourly billing ----
  hourlyRate: { type: Number },
  actualHours: { type: Number },
  materialCharge: { type: Number, default: 0 },

  // Payment
  paymentMethod: { type: String, default: 'cash' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'partial', 'refunded'], default: 'pending' },

  // Booking status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'upcoming', 'ongoing', 'quote_sent', 'quote_approved', 'completed', 'cancelled'],
    default: 'pending',
  },

  isReviewed: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-generate bookingId before saving
bookingSchema.pre('save', async function (next) {
  if (!this.bookingId) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingId = `HF${1001 + count}`;
  }
  this.updatedAt = new Date();
  next();
});

// Index for preventing double bookings
bookingSchema.index({ provider: 1, date: 1, time: 1 }, { unique: true, partialFilterExpression: { status: { $nin: ['cancelled', 'rejected'] } } });
bookingSchema.index({ serviceLocation: '2dsphere' });

module.exports = mongoose.model('Booking', bookingSchema);
