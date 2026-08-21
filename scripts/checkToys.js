const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("../models/Product");

async function checkToysProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const toys = await Product.find({ category: /toys/i }).sort({ displayOrder: 1, createdAt: 1 }).lean();
    console.log(`Found ${toys.length} products in Toys category:`);
    toys.forEach((t, i) => {
      const img = t.mainImage?.url || (Array.isArray(t.images) ? (typeof t.images[0] === 'string' ? t.images[0] : t.images[0]?.url) : '') || '';
      console.log(`[${i+1}] ID: ${t._id} | Title: "${t.title}" | Price: ₹${t.price} | Disc: ₹${t.discountPrice} | Image: "${img}"`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkToysProducts();
