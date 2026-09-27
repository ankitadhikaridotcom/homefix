const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  label: {
    type: String,
    enum: ['Home', 'Work', 'Other'],
    default: 'Home',
  },
  customLabel: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  locality: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  country: { type: String, default: 'India', trim: true },
  pincode: { type: String, trim: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  
  // GeoJSON Point for 2dsphere indexing [longitude, latitude]
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update timestamp before save
addressSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Create 2dsphere index for address searches
addressSchema.index({ location: '2dsphere' });
addressSchema.index({ user: 1 });

module.exports = mongoose.model('Address', addressSchema);
