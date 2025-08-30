const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');

router.get('/:id/orders', async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.params.id })
      .populate('user_id', 'username')
      .sort({ created_at: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/username/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user by username:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;