const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  price: { type: Number, required: true, min: 0 },
  stock_quantity: { type: Number, required: true, min: 0, default: 0 },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }
}, { timestamps: true });

productSchema.index({ sku: 1 }); // Ensure SKU is indexed for fast lookups

module.exports = mongoose.model('Product', productSchema);