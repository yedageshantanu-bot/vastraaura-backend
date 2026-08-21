const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("../models/Product");

async function listAllProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const products = await Product.find({}).sort({ displayOrder: 1, createdAt: 1 }).lean();
    console.log(`Total products in DB: ${products.length}`);
    products.forEach((p, i) => {
      const img = p.mainImage?.url || (Array.isArray(p.images) ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.url) : '') || '';
      console.log(`[${i+1}] ID: ${p._id} | Title: "${p.title}" | Price: ₹${p.price} | Disc: ₹${p.discountPrice} | Image: "${img}"`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

listAllProducts();
