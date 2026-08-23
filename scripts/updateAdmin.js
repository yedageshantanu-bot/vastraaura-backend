require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const updateAdmins = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const emails = ["yedageshantanu70@gmail.com", "pawartanu417@gmail.com"];
    
    for (const email of emails) {
      const user = await User.findOneAndUpdate(
        { email: email },
        { role: "admin" },
        { new: true }
      );
      if (user) {
        console.log(`Updated user ${email} to admin.`);
      } else {
        console.log(`User ${email} not found.`);
      }
    }
    console.log("Done.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

updateAdmins();
