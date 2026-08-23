require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("./models/Category");
const Product = require("./models/Product");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const categories = await Category.find();
  console.log("Categories:", categories);
  process.exit(0);
}
run();
