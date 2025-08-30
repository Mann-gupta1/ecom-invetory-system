import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductCatalog = ({ onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filter, categoryFilter]);

  const fetchProducts = async () => {
    try {
      let url = '/api/products';
      if (filter === 'low-stock') url = '/api/products/low-stock';
      if (categoryFilter) url += `?category_id=${categoryFilter}`;
      const response = await axios.get(url);
      setProducts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load products: ' + (err.response?.data?.message || err.message));
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load categories: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Product Catalog</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="flex mb-4 space-x-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Products</option>
          <option value="low-stock">Low Stock (&lt; 10)</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category._id} value={category._id}>{category.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <div key={product._id} className="border p-4 rounded shadow">
            <h3 className="text-lg font-medium">{product.name}</h3>
            <p>SKU: {product.sku}</p>
            <p>Price: ${product.price}</p>
            <p>Stock: {product.stock_quantity}</p>
            <p>Category: {product.category_id.name}</p>
            {product.lowStockAlert && (
              <p className="text-red-500 font-semibold">{product.lowStockAlert}</p>
            )}
            <button
              onClick={() => onAddToCart(product)}
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
              disabled={product.stock_quantity === 0}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCatalog;