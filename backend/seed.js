const mongoose = require('mongoose');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');

async function seedDatabase() {
  try {
    // Check if a user exists
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const user = await User.create({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        username: 'testuser'
      });
      console.log('Created default user:', user);

      // Check if a category exists
      const categoryCount = await Category.countDocuments();
      if (categoryCount === 0) {
        const category = await Category.create({
          name: 'Electronics',
          description: 'Gadgets and devices'
        });
        console.log('Created default category:', category);

        // Check if products exist
        const productCount = await Product.countDocuments();
        if (productCount === 0) {
          await Product.create([
            {
              name: 'Laptop',
              sku: 'LAP123',
              price: 999.99,
              stock_quantity: 50,
              category_id: category._id,
              version: 0
            },
            {
              name: 'Smartphone',
              sku: 'PHONE456',
              price: 499.99,
              stock_quantity: 5,
              category_id: category._id,
              version: 0
            }
          ]);
          console.log('Created default products');
        }
      }
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

module.exports = seedDatabase;