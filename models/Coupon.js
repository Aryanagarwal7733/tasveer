const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  value: { type: Number, required: true },
  minCart: { type: Number, default: 0 },
  expiry: { type: String, default: '2026-12-31' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', CouponSchema);
