const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String },
  description: { type: String, default: '' },
  icon: { type: String, default: 'fa-images' },
  image: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', CategorySchema);
