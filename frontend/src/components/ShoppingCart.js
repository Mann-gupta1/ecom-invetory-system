import React, { useState } from 'react';
import axios from 'axios';

const ShoppingCart = ({ cart, setCart, userId }) => {
  const [error, setError] = useState('');

  const handleQuantityChange = (productId, quantity) => {
    const product = cart.find(item => item.product._id === productId).product;
    if (quantity > product.stock_quantity) {
      setError(`Cannot add more than ${product.stock_quantity} of ${product.name} to cart`);
      return;
    }
    setError('');
    setCart(cart.map(item =>
      item.product._id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  };

  const handleRemove = (productId) => {
    setCart(cart.filter(item => item.product._id !== productId));
    setError('');
  };

  const handleCheckout = async () => {
    try {
      const items = cart.map(item => ({
        product_id: item.product._id,
        quantity: item.quantity
      }));
      const response = await axios.post('/api/orders', { user_id: userId, items });
      alert(`Order placed successfully! Total: $${response.data.total.toFixed(2)} (Subtotal: $${response.data.subtotal.toFixed(2)}, Tax: $${response.data.tax.toFixed(2)}, Shipping: $${response.data.shipping.toFixed(2)})`);
      setCart([]);
      setError('');
    } catch (err) {
      const message = err.response?.status === 409
        ? 'Concurrent update detected, please try again'
        : err.response?.data?.message || err.message;
      setError('Error placing order: ' + message);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = 5.99; // Flat shipping fee
  const total = subtotal + tax + shipping;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Shopping Cart</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {cart.length === 0 ? (
        <p>Cart is empty</p>
      ) : (
        <>
          <ul className="space-y-4">
            {cart.map(item => (
              <li key={item.product._id} className="flex justify-between items-center border p-4 rounded">
                <div>
                  <p>{item.product.name} (SKU: {item.product.sku})</p>
                  <p>Price: ${item.product.price}</p>
                  <input
                    type="number"
                    min="1"
                    max={item.product.stock_quantity}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.product._id, parseInt(e.target.value))}
                    className="border p-1 w-16"
                  />
                </div>
                <button
                  onClick={() => handleRemove(item.product._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <p>Subtotal: ${subtotal.toFixed(2)}</p>
            <p>Tax (8%): ${tax.toFixed(2)}</p>
            <p>Shipping: ${shipping.toFixed(2)}</p>
            <p className="text-lg font-semibold">Total: ${total.toFixed(2)}</p>
          </div>
          <button
            onClick={handleCheckout}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Checkout
          </button>
        </>
      )}
    </div>
  );
};

export default ShoppingCart;