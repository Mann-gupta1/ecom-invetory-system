import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductCatalog = ({ onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch products
        let productUrl = 'http://localhost:5000/api/products'; // Direct URL
        if (filter === 'low-stock') productUrl = 'http://localhost:5000/api/products/low-stock';
        if (categoryFilter) productUrl += `?category_id=${categoryFilter}`;
        const productResponse = await axios.get(productUrl);
        console.log('Products fetched:', productResponse.data); // Debug log
        setProducts(productResponse.data);

        // Fetch categories
        const categoryResponse = await axios.get('http://localhost:5000/api/categories'); // Direct URL
        console.log('Categories fetched:', categoryResponse.data); // Debug log
        setCategories(categoryResponse.data);

        setError('');
      } catch (err) {
        console.error('Error fetching data:', err); // Debug log
        setError('Failed to load data: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter, categoryFilter]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Product Catalog</h2>
      {loading && <p className="text-gray-500">Loading products...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!loading && !error && (
        <>
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
          {filteredProducts.length === 0 ? (
            <p>No products found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <div key={product._id} className="border p-4 rounded shadow">
                  <h3 className="text-lg font-medium">{product.name}</h3>
                  <p>SKU: {product.sku}</p>
                  <p>Price: ${product.price}</p>
                  <p>Stock: {product.stock_quantity}</p>
                  <p>Category: {product.category_id?.name || 'Unknown'}</p>
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
          )}
        </>
      )}
    </div>
  );
};

export default ProductCatalog;