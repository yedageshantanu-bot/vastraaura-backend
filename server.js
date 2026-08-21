const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const helmet = require("helmet");
require("dotenv").config();

// Enforce that all critical integration and authentication keys are set.
const checkEnvVars = () => {
  const isProd = process.env.NODE_ENV === "production";
  const criticalVars = [
    "MONGODB_URI",
    "JWT_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
  ];

  const missing = criticalVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const errMsg = `Critical environment variables missing: ${missing.join(", ")}`;
    if (isProd) {
      console.error(`[FATAL] ${errMsg}. Application cannot start in production.`);
      process.exit(1);
    } else {
      console.warn(`[WARNING] ${errMsg}. Some features may not work correctly.`);
    }
  }
};
checkEnvVars();

const passport = require("./src/config/passport");
const requireDatabase = require("./src/middleware/requireDatabase");

const connectDB = require("./config/db");

const rateLimit = require("express-rate-limit");
const { mongoSanitizeMiddleware, xssSanitizeMiddleware } = require("./src/middleware/sanitizeInput");

const app = express();

// Apply production security headers (XSS, Clickjacking, nosniff, HSTS)
app.use(
  helmet({
    frameguard: {
      action: "deny",
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "res.cloudinary.com"],
      },
    },
  })
);

const PORT = process.env.PORT || 5001;

const getAllowedOrigins = () => {
  const configured = [process.env.CLIENT_URL].filter(Boolean);
  const extra = (process.env.ADDITIONAL_ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return new Set([...configured, ...extra]);
};

const isLocalFrontendOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin || "");

const isAllowedOrigin = (origin) =>
  !origin ||
  getAllowedOrigins().has(origin) ||
  isLocalFrontendOrigin(origin);

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
    allowedHeaders: ["Content-Type", "Authorization", "Bypass-Tunnel-Reminder"],
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

// Apply NoSQL and XSS input sanitization
app.use(mongoSanitizeMiddleware);
app.use(xssSanitizeMiddleware);

// Global API Rate Limiter
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api", globalApiLimiter);

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
app.use("/api/combos", require("./routes/comboRoutes"));

app.get("/api/categories", (req, res) => {
  res.json([
    {
      name: "Toys",
      slug: "toys",
      image: "https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=400",
      count: 8,
      tint: "#F4F0FF"
    },
    {
      name: "Flowers",
      slug: "flowers",
      image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400",
      count: 8,
      tint: "#EAF5FF"
    },
    {
      name: "Chocolates",
      slug: "sweets",
      image: "/sweets/IMG_4057.JPG.jpeg",
      count: 15,
      tint: "#FFF0F3"
    },
    {
      name: "Healthy Sweets",
      slug: "healthy-sweets",
      image: "/kind of sweets but not choclate/image13.jpeg",
      count: 29,
      tint: "#FDF4E3"
    }
  ]);
});



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
