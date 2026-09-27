const mongoose = require('mongoose');

const customServiceRequestSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceTitle: { type: String, default: 'Custom Service' },
  description: { type: String, required: true },
  photos: [{ type: String }],
  
  // Service Location GeoJSON [longitude, latitude]
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
    address: { type: String, required: true },
    locality: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    houseOrFlat: { type: String },
    landmark: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
  },

  date: { type: String, required: true },
  time: { type: String, required: true },
  budget: { type: Number }, // Optional

  status: {
    type: String,
    enum: [
      'PENDING',              // Request created, no provider selected yet
      'PROVIDER_SELECTED',    // Customer selected a provider from the accepted ones
      'QUOTE_SENT',           // Selected provider sent a quote
      'QUOTE_ACCEPTED',       // Customer accepted the quote and paid (booking created)
      'EXPIRED',              // Nobody accepted or customer didn't act
      'CANCELLED'             // Cancelled by customer
    ],
    default: 'PENDING'
  },

  // Providers who clicked "Accept"
  acceptedProviders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Providers who were notified but clicked "Decline"
  declinedProviders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // The one provider the customer finally chose
  selectedProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // References to subsequent documents
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },

  expiresAt: { type: Date }, // Optional: e.g. 24 hours from creation
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

customServiceRequestSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Add 2dsphere index
customServiceRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('CustomServiceRequest', customServiceRequestSchema);
