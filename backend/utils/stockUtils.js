const Product = require('../models/Product');

async function updateStock(productId, stockChange, io, session) {
  try {
    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error('Product not found');
    if (product.stock_quantity + stockChange < 0) {
      throw new Error(`Insufficient stock for ${product.name} (Available: ${product.stock_quantity})`);
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, version: product.version },
      {
        $inc: { stock_quantity: stockChange, version: 1 },
        $set: { updatedAt: new Date() }
      },
      { new: true, session }
    );

    if (!updatedProduct) {
      throw new Error('Concurrent update detected, please retry');
    }

    io.emit('stockUpdate', {
      ...updatedProduct.toObject(),
      lowStockAlert: updatedProduct.stock_quantity < 10 ? 'Low stock warning!' : null
    });

    return updatedProduct;
  } catch (err) {
    throw err;
  }
}

module.exports = { updateStock };