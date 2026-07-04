const mongoose = require("mongoose");

const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    success: false,
    error: "MongoDB connection is required",
    database: "disconnected",
  });
};

module.exports = requireDatabase;
