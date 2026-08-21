const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("../models/Product");

async function executeImageDeduplication() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for image deduplication...");

    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    console.log(`Total products before image cleanup: ${products.length}`);

    const seenImages = new Set();
    const keepIds = [];
    const deleteIds = [];

    for (const product of products) {
      const mainImg = product.mainImage?.url || (Array.isArray(product.images) ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url) : '') || '';
      const normalizedUrl = mainImg.trim().toLowerCase();

      if (!normalizedUrl) {
        keepIds.push(product._id);
        continue;
      }

      if (seenImages.has(normalizedUrl)) {
        deleteIds.push(product._id);
      } else {
        seenImages.add(normalizedUrl);
        keepIds.push(product._id);
      }
    }

    console.log(`Unique products with distinct images to KEEP: ${keepIds.length}`);
    console.log(`Duplicate image products to DELETE: ${deleteIds.length}`);

    if (deleteIds.length > 0) {
      const result = await Product.deleteMany({ _id: { $in: deleteIds } });
      console.log(`Successfully deleted ${result.deletedCount} products with repeated images.`);
    }

    const finalProducts = await Product.find({}).lean();
    console.log(`Final total products in MongoDB: ${finalProducts.length}`);

    await mongoose.disconnect();
    console.log("Database disconnected.");
  } catch (error) {
    console.error("Error deduplicating product images:", error);
    process.exit(1);
  }
}

executeImageDeduplication();
