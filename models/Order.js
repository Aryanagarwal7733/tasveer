const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  orderNumber: { type: String },
  customerName: { type: String },
  customerPhone: { type: String },
  customerEmail: { type: String },
  shippingAddress: { type: mongoose.Schema.Types.Mixed },
  items: { type: [mongoose.Schema.Types.Mixed], default: [] },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  couponApplied: { type: String, default: '' },
  paymentMethod: { type: String, default: 'Razorpay' },
  paymentStatus: { type: String, default: 'Pending' },
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignature: { type: String, default: '' },
  orderStatus: { type: String, default: 'Order Placed' },
  trackingNumber: { type: String, default: '' },
  notes: { type: String, default: '' },
  timeline: { type: [mongoose.Schema.Types.Mixed], default: [] },
  rawPayload: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);
