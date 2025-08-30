import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import ProductCatalog from './ProductCatalog';
import ShoppingCart from './ShoppingCart';
import OrderHistory from './OrderHistory';

const socket = io('http://localhost:5000', { reconnect: true });

const Inventory = () => {
  const [cart, setCart] = useState([]);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // Added to track user loading

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users/username/testuser'); // Direct URL
        if (response.data && response.data._id) {
          setUserId(response.data._id);
          setError('');
        } else {
          setError('Invalid user data received');
        }
      } catch (err) {
        setError('Failed to fetch user: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchUser();

    socket.on('connect_error', () => {
      setError('Cannot connect to backend. Please check the server.');
    });

    socket.on('stockUpdate', (updatedProduct) => {
      setCart(prevCart =>
        prevCart.map(item =>
          item.product._id === updatedProduct._id
            ? { ...item, product: updatedProduct }
            : item
        )
      );
    });

    return () => {
      socket.off('stockUpdate');
      socket.off('connect_error');
    };
  }, []);

  const handleAddToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product._id === product._id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  return (
    <div className="container mx-auto p-4">
      {loading && <div className="text-gray-500">Loading user...</div>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!loading && userId && (
        <>
          <ProductCatalog onAddToCart={handleAddToCart} />
          <ShoppingCart cart={cart} setCart={setCart} userId={userId} />
          <OrderHistory userId={userId} />
        </>
      )}
    </div>
  );
};

export default Inventory;