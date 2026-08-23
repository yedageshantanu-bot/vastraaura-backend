require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function checkUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({}, "email role name");
  console.log(users);
  process.exit(0);
}

checkUsers();
