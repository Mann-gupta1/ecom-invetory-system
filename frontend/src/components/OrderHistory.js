import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OrderHistory = ({ userId }) => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`/api/users/${userId}/orders`);
        setOrders(response.data);
        setError('');
      } catch (err) {
        setError('Failed to load orders: ' + err.response?.data?.message || err.message);
      }
    };
    fetchOrders();
  }, [userId]);

  const handleCancelOrder = async (orderId) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`, { status: 'cancelled' });
      setOrders(orders.map(order =>
        order._id === orderId ? { ...order, status: 'cancelled' } : order
      ));
      setError('');
    } catch (err) {
      setError('Failed to cancel order: ' + err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Order History</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <ul className="space-y-4">
          {orders.map(order => (
            <li key={order._id} className="border p-4 rounded">
              <p>Order #{order._id}</p>
              <p>Total: ${order.total}</p>
              <p>Status: {order.status}</p>
              <p>Created: {new Date(order.created_at).toLocaleString()}</p>
              {order.status === 'pending' && (
                <button
                  onClick={() => handleCancelOrder(order._id)}
                  className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Cancel Order
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrderHistory;