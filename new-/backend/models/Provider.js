const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'Invalid email address'],
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: { type: String, required: true },
  role: { type: String, default: 'provider' },
  phoneVerified: { type: Boolean, default: false },
  profileImage: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    pincode: { type: String },
    landmark: { type: String },
  },
  // Provider specific fields
  servicesOffered: [{ type: String }],
  rating: { type: Number, default: 0 },
  availability: { type: Boolean, default: true },
  earnings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Provider', providerSchema);
