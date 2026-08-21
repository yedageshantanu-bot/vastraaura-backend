const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("../models/Product");

async function updateFlowerPrices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");

    // Find all products in Flowers category
    const flowerProducts = await Product.find({ category: /flowers/i });
    console.log(`Found ${flowerProducts.length} flower products in MongoDB.`);

    flowerProducts.forEach((p) => {
      console.log(`Before: "${p.title}" -> price: ₹${p.price}, discountPrice: ₹${p.discountPrice}`);
    });

    // Update prices of flower products to ₹899 (discountPrice ₹899, original price e.g. ₹1,199 or ₹1,299)
    const result = await Product.updateMany(
      { category: /flowers/i },
      {
        $set: {
          price: 1199,
          discountPrice: 899,
        },
      }
    );

    console.log(`Updated ${result.modifiedCount} flower bouquet products to ₹899!`);

    const updatedFlowerProducts = await Product.find({ category: /flowers/i }).lean();
    updatedFlowerProducts.forEach((p) => {
      console.log(`After: "${p.title}" -> price: ₹${p.price}, discountPrice: ₹${p.discountPrice}`);
    });

  } catch (error) {
    console.error("Error updating flower prices:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
}

updateFlowerPrices();
