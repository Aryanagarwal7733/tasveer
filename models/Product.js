const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  title: { type: String },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, default: 0 },
  basePrice: { type: Number },
  rating: { type: Number, default: 5 },
  reviews: { type: Number, default: 0 },
  badge: { type: String, default: '' },
  stock: { type: Number, default: 50 },
  sku: { type: String, default: '' },
  image: { type: String, default: '' },
  desc: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  sizes: { type: mongoose.Schema.Types.Mixed, default: [] },
  moldings: { type: mongoose.Schema.Types.Mixed, default: [] },
  formats: { type: mongoose.Schema.Types.Mixed, default: [] },
  isDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);
