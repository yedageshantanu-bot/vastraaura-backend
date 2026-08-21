const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("../models/Product");

async function deletePinkBunny() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");

    // Find products matching pink plush bunny or IMG_4913.PNG
    const targets = await Product.find({
      $or: [
        { title: { $regex: /2-feet giant pink plush bun/i } },
        { "mainImage.url": "/toys/IMG_4913.PNG" },
        { "images.url": "/toys/IMG_4913.PNG" }
      ]
    }).lean();

    console.log(`Found ${targets.length} target products to delete:`);
    targets.forEach((p) => {
      console.log(`- ID: ${p._id} | Title: "${p.title}" | Image: "${p.mainImage?.url}"`);
    });

    if (targets.length > 0) {
      const deleteIds = targets.map((t) => t._id);
      const res = await Product.deleteMany({ _id: { $in: deleteIds } });
      console.log(`Deleted ${res.deletedCount} products successfully.`);
    }

    await mongoose.disconnect();
    console.log("Database disconnected.");
  } catch (err) {
    console.error("Error deleting product:", err);
  }
}

deletePinkBunny();
