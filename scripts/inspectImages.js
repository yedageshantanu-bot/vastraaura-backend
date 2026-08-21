const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("../models/Product");

async function inspectImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const products = await Product.find({
      title: { $regex: /penguin|teddy|goose/i }
    }).lean();

    console.log(`Found ${products.length} products matching regex:`);
    products.forEach((p) => {
      console.log(`\nTitle: "${p.title}" (ID: ${p._id})`);
      console.log(`  Price: ₹${p.price} | Disc: ₹${p.discountPrice}`);
      console.log(`  mainImage:`, p.mainImage);
      console.log(`  images:`, p.images);
      console.log(`  media:`, p.media);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

inspectImages();
