const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("../models/Product");

async function removeDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for product deduplication...");

    const allProducts = await Product.find({}).sort({ createdAt: -1 }).lean();
    console.log(`Total products before cleanup: ${allProducts.length}`);

    const seenTitles = new Set();
    const keepIds = [];
    const deleteIds = [];

    for (const product of allProducts) {
      const normalizedTitle = (product.title || "").trim().toLowerCase();
      if (!normalizedTitle) {
        deleteIds.push(product._id);
        continue;
      }

      if (seenTitles.has(normalizedTitle)) {
        deleteIds.push(product._id);
      } else {
        seenTitles.add(normalizedTitle);
        keepIds.push(product._id);
      }
    }

    console.log(`Keeping ${keepIds.length} unique products.`);
    console.log(`Deleting ${deleteIds.length} duplicate product entries.`);

    if (deleteIds.length > 0) {
      const result = await Product.deleteMany({ _id: { $in: deleteIds } });
      console.log(`Deleted ${result.deletedCount} duplicate products successfully.`);
    }

    const finalProducts = await Product.find({}).lean();
    console.log(`Final total products in MongoDB: ${finalProducts.length}`);

    await mongoose.disconnect();
    console.log("Database disconnected.");
  } catch (error) {
    console.error("Error deduplicating products:", error);
    process.exit(1);
  }
}

removeDuplicates();
