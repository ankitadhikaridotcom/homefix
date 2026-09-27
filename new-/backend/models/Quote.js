const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomServiceRequest', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  inspectionFee: { type: Number, default: 0 },
  labourFee: { type: Number, default: 0 },
  materialFee: { type: Number, default: 0 },
  additionalFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  
  totalAmount: { type: Number, required: true },

  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

quoteSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Quote', quoteSchema);
