import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import ProductCatalog from './ProductCatalog';
import ShoppingCart from './ShoppingCart';
import OrderHistory from './OrderHistory';

const socket = io('http://localhost:5000');

const Inventory = () => {
  const [cart, setCart] = useState([]);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/users/username/testuser');
        setUserId(response.data._id);
      } catch (err) {
        setError('Failed to fetch user: ' + (err.response?.data?.message || err.message));
      }
    };
    fetchUser();

    socket.on('stockUpdate', (updatedProduct) => {
      setCart(prevCart =>
        prevCart.map(item =>
          item.product._id === updatedProduct._id
            ? { ...item, product: updatedProduct }
            : item
        )
      );
    });

    return () => socket.off('stockUpdate');
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

  if (!userId) {
    return <div>{error || 'Loading user...'}</div>;
  }

  return (
    <div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <ProductCatalog onAddToCart={handleAddToCart} />
      <ShoppingCart cart={cart} setCart={setCart} userId={userId} />
      <OrderHistory userId={userId} />
    </div>
  );
};

export default Inventory;