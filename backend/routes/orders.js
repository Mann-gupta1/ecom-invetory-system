const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { updateStock } = require('../utils/stockUtils'); // Updated import

const TAX_RATE = 0.08;
const SHIPPING_FEE = 5.99;

router.post('/', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { user_id, items } = req.body;
    if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'user_id and non-empty items array are required' });
    }

    let subtotal = 0;
    for (const item of items) {
      if (!item.product_id || !Number.isInteger(item.quantity) || item.quantity < 1) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Each item must have a valid product_id and quantity (positive integer)' });
      }
      const product = await Product.findById(item.product_id).session(session);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: `Product ${item.product_id} not found` });
      }
      if (product.stock_quantity < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Insufficient stock for ${product.name} (Available: ${product.stock_quantity})` });
      }
      subtotal += product.price * item.quantity;
    }

    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax + SHIPPING_FEE;

    const order = new Order({ user_id, total, status: 'pending' });
    const savedOrder = await order.save({ session });

    for (const item of items) {
      const product = await Product.findById(item.product_id).session(session);
      const orderItem = new OrderItem({
        order_id: savedOrder._id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_time: product.price
      });
      await orderItem.save({ session });
      await updateStock(item.product_id, -item.quantity, req.io, session);
    }

    await session.commitTransaction();
    res.status(201).json({ order: savedOrder, subtotal, tax, shipping: SHIPPING_FEE });
  } catch (err) {
    await session.abortTransaction();
    console.error('Error creating order:', err);
    res.status(err.message.includes('Concurrent') ? 409 : 400).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user_id', 'username');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const items = await OrderItem.find({ order_id: req.params.id }).populate('product_id', 'name sku');
    const subtotal = items.reduce((sum, item) => sum + item.price_at_time * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const shipping = SHIPPING_FEE;
    res.json({ order, items, subtotal, tax, shipping });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.put('/:id/status', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(req.params.id).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Order not found' });
    }

    const { status } = req.body;
    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (status === 'cancelled' && order.status !== 'cancelled') {
      if (!['pending', 'processing'].includes(order.status)) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Only pending or processing orders can be cancelled' });
      }
      const items = await OrderItem.find({ order_id: order._id }).session(session);
      for (const item of items) {
        await updateStock(item.product_id, item.quantity, req.io, session);
      }
    }

    order.status = status;
    const updatedOrder = await order.save({ session });
    await session.commitTransaction();
    res.json(updatedOrder);
  } catch (err) {
    await session.abortTransaction();
    console.error('Error updating order status:', err);
    res.status(err.message.includes('Concurrent') ? 409 : 400).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

router.post('/:id/fulfill', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(req.params.id).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.status !== 'pending' && order.status !== 'processing') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Order cannot be fulfilled' });
    }

    order.status = 'shipped';
    const updatedOrder = await order.save({ session });
    await session.commitTransaction();
    res.json(updatedOrder);
  } catch (err) {
    await session.abortTransaction();
    console.error('Error fulfilling order:', err);
    res.status(400).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;