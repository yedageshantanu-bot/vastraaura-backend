require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function fixRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const emails = ["yedageshantanu70@gmail.com", "pawartanu417@gmail.com"];
    
    const result = await User.updateMany(
      { email: { $in: emails } },
      { $set: { role: "admin" } }
    );
    
    console.log(`Updated ${result.modifiedCount} users to admin.`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

fixRoles();
