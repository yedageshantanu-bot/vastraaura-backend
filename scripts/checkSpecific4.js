const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("../models/Product");

async function checkSpecific4() {
  await mongoose.connect(process.env.MONGODB_URI);
  const titles = [
    "2-Feet Cuddly Penguin Plushie",
    "3-Feet Cuddly Penguin Plushie",
    "4-Feet Giant Fluffy Teddy Bear",
    "Dramatic Cuddly Goose Pillow"
  ];
  for (const t of titles) {
    const p = await Product.findOne({ title: t }).lean();
    if (p) {
      console.log(`Title: "${p.title}"`);
      console.log(`  mainImage:`, p.mainImage);
      console.log(`  images:`, p.images);
    } else {
      console.log(`NOT FOUND: "${t}"`);
    }
  }
  await mongoose.disconnect();
}

checkSpecific4();
