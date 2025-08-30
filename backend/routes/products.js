const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { updateStock } = require('../utils/stockUtils'); // Import from new utility file

router.get('/', async (req, res) => {
  try {
    const products = await Product.find().populate('category_id', 'name');
    const productsWithAlerts = products.map(product => ({
      ...product.toObject(),
      lowStockAlert: product.stock_quantity < 10 ? 'Low stock warning!' : null
    }));
    res.json(productsWithAlerts);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, sku, price, stock_quantity, category_id } = req.body;
  if (!name || !sku || price === undefined || stock_quantity === undefined || !category_id) {
    return res.status(400).json({ message: 'All fields (name, sku, price, stock_quantity, category_id) are required' });
  }
  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ message: 'Price must be a non-negative number' });
  }
  if (!Number.isInteger(stock_quantity) || stock_quantity < 0) {
    return res.status(400).json({ message: 'Stock quantity must be a non-negative integer' });
  }

  try {
    const product = new Product({ name, sku, price, stock_quantity, category_id });
    const newProduct = await product.save();
    req.io.emit('stockUpdate', { ...newProduct.toObject(), lowStockAlert: newProduct.stock_quantity < 10 ? 'Low stock warning!' : null });
    res.status(201).json(newProduct);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const product = await Product.findById(req.params.id).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, sku, price, stock_quantity, category_id } = req.body;
    if (name !== undefined && !name) return res.status(400).json({ message: 'Name cannot be empty' });
    if (sku !== undefined && !sku) return res.status(400).json({ message: 'SKU cannot be empty' });
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return res.status(400).json({ message: 'Price must be a non-negative number' });
    }
    if (stock_quantity !== undefined && (!Number.isInteger(stock_quantity) || stock_quantity < 0)) {
      return res.status(400).json({ message: 'Stock quantity must be a non-negative integer' });
    }

    if (name) product.name = name;
    if (sku) product.sku = sku;
    if (price !== undefined) product.price = price;
    if (category_id) product.category_id = category_id;
    if (stock_quantity !== undefined) {
      await updateStock(product._id, stock_quantity - product.stock_quantity, req.io, session);
    } else {
      await product.save({ session });
    }

    await session.commitTransaction();
    res.json(product);
  } catch (err) {
    await session.abortTransaction();
    console.error('Error updating product:', err);
    res.status(400).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    const products = await Product.find({ stock_quantity: { $lt: 10 } }).populate('category_id', 'name');
    const productsWithAlerts = products.map(product => ({
      ...product.toObject(),
      lowStockAlert: 'Low stock warning!'
    }));
    res.json(productsWithAlerts);
  } catch (err) {
    console.error('Error fetching low-stock products:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.put('/:id/stock', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { stock_quantity } = req.body;
    if (stock_quantity === undefined || !Number.isInteger(stock_quantity) || stock_quantity < 0) {
      return res.status(400).json({ message: 'Stock quantity must be a non-negative integer' });
    }

    const product = await Product.findById(req.params.id).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedProduct = await updateStock(req.params.id, stock_quantity - product.stock_quantity, req.io, session);
    await session.commitTransaction();
    res.json(updatedProduct);
  } catch (err) {
    await session.abortTransaction();
    console.error('Error updating stock:', err);
    res.status(err.message.includes('Concurrent') ? 409 : 400).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;