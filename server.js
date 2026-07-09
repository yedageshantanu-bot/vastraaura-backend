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
  /\.workers\.dev$/.test(origin || "") || /\.loca\.lt$/.test(origin || "") || /\.pages\.dev(:\d+)?$/.test(origin || "");
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

app.get("/api/categories", (req, res) => {
  res.json([
    {
      name: "Toys",
      slug: "toys",
      image: "https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=400",
      count: 3,
      tint: "#F4F0FF"
    },
    {
      name: "Jewelry",
      slug: "jewelry",
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400",
      count: 3,
      tint: "#FFF4F7"
    },
    {
      name: "Flowers",
      slug: "flowers",
      image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400",
      count: 3,
      tint: "#EAF5FF"
    }
  ]);
});

app.get("/api/combos", (req, res) => {
  res.json([
    {
      id: "combo1",
      name: "Premium Trio Love Gift Hamper",
      image: "/flowers/IMG_3520.JPG.jpeg",
      ribbon: "Best Seller",
      savings_pct: 20,
      tagline: "FLOWERS + JEWELRY + TOYS",
      included: [
        "Crimson Velvet Rose Bouquet",
        "Twin Hearts Interlocking Pendant",
        "Calming Lavender Plush Bear"
      ],
      original_price: 9997,
      price: 7999
    },
    {
      id: "combo2",
      name: "Sparkling Celestial Combo",
      image: "/jewelley/IMG_3617.JPG.jpeg",
      ribbon: "Highly Rated",
      savings_pct: 23,
      tagline: "JEWELRY + TOYS",
      included: [
        "Sun & Moon Celestial Necklace",
        "Twin Magnetic Love Pandas"
      ],
      original_price: 6498,
      price: 4999
    },
    {
      id: "combo3",
      name: "Sweet Comfort Flowers & Plush",
      image: "/toys/IMG_3674.JPG.jpeg",
      ribbon: "Cozy Choice",
      savings_pct: 22,
      tagline: "FLOWERS + TOYS",
      included: [
        "Grand Celebration Flower Basket",
        "Blush Pink Fluffy Pillow Bear"
      ],
      original_price: 4498,
      price: 3499
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
