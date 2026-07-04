const mongoose = require("mongoose");

const shouldAllowMemoryFallback = () =>
  String(process.env.ALLOW_MEMORY_FALLBACK || "").toLowerCase() === "true";

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    const message = "MONGODB_URI is missing from the environment";
    if (!shouldAllowMemoryFallback()) {
      throw new Error(message);
    }

    console.warn("MongoDB connection skipped");
    console.warn(message);
    return null;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS || 10000),
    });
    console.log("MongoDB Connected Successfully");
    return mongoose.connection;
  } catch (error) {
    if (!shouldAllowMemoryFallback()) {
      throw error;
    }

    console.warn("MongoDB connection skipped");
    console.warn(error.message);
    return null;
  }
};

module.exports = connectDB;
module.exports.shouldAllowMemoryFallback = shouldAllowMemoryFallback;
