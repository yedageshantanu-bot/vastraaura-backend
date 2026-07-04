const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const passport = require("./src/config/passport");
const requireDatabase = require("./src/middleware/requireDatabase");

const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5001;
const getAllowedOrigins = () => new Set([process.env.CLIENT_URL].filter(Boolean));
const isLocalFrontendOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin || "");
const isCloudflareWorkersDevOrigin = (origin) =>
  /\.workers\.dev$/.test(origin || "") || /\.loca\.lt$/.test(origin || "");
const isAllowedOrigin = (origin) =>
  !origin ||
  getAllowedOrigins().has(origin) ||
  isLocalFrontendOrigin(origin) ||
  isCloudflareWorkersDevOrigin(origin);

const getDatabaseStatus = () => {
  switch (mongoose.connection.readyState) {
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "disconnected";
  }
};

// Allow the frontend app to call the API while keeping credentials enabled.
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use((req, res, next) => {
  const unsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  const origin = req.headers.origin;

  if (unsafeMethod && origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ error: "Request not allowed" });
  }

  return next();
});
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server running",
    server: "running",
    database: getDatabaseStatus(),
  });
});

app.use("/api", requireDatabase);

// Root-level feature modules keep the production folder structure clean.
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(require("./middleware/errorHandler"));

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Database status: ${getDatabaseStatus()}`);
    });
  } catch (error) {
    console.error("Server startup failed");
    console.error(error.message);
    process.exitCode = 1;
  }
};

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
  getDatabaseStatus,
};
