const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
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
  role: { type: String, default: 'customer' },
  phoneVerified: { type: Boolean, default: false },
  profileImage: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    pincode: { type: String },
    landmark: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Customer', customerSchema);
