require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const Coupon = require("../models/Coupon");

const tag = `codex-launch-${Date.now()}`;

const log = (label, value = {}) => {
  console.log(`${label}: ${JSON.stringify(value)}`);
};

const cleanup = async () => {
  await Promise.allSettled([
    Product.deleteMany({ slug: new RegExp(`^${tag}`) }),
    Order.deleteMany({ orderId: new RegExp(`^${tag}`) }),
    User.deleteMany({ email: new RegExp(`^${tag}@example\\.com$`) }),
    Coupon.deleteMany({ code: new RegExp(`^${tag.toUpperCase()}`) }),
  ]);
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS || 15000),
  });

  log("mongodb_connected", {
    host: mongoose.connection.host,
    database: mongoose.connection.name,
    readyState: mongoose.connection.readyState,
  });

  await cleanup();

  const customer = await User.create({
    name: "Codex Launch Customer",
    email: `${tag}@example.com`,
    passwordHash: await bcrypt.hash("LaunchTest123!", 12),
    authProvider: "local",
    role: "customer",
  });
  log("customers_create_read", { id: String(customer._id), email: customer.email });

  const product = await Product.create({
    title: "Codex Launch Verification Saree",
    slug: `${tag}-saree`,
    description: "Temporary product used to verify production MongoDB CRUD.",
    shortDescription: "Launch verification product",
    price: 1999,
    discountPrice: 1499,
    category: "Launch Verification",
    subCategory: "Automated Test",
    fabric: "Silk",
    occasion: "Verification",
    color: "Maroon",
    stock: 5,
    displayOrder: 1,
    images: [
      {
        url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        publicId: `${tag}/sample-image`,
        resourceType: "image",
      },
    ],
    videos: [
      {
        url: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
        publicId: `${tag}/sample-video`,
        resourceType: "video",
      },
    ],
    media: {
      videos: [
        {
          url: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
          publicId: `${tag}/sample-video`,
          resourceType: "video",
        },
      ],
    },
    reviews: [{ user: customer._id, rating: 5, comment: "Launch verification review" }],
  });
  log("products_create_read", { id: String(product._id), slug: product.slug });
  log("categories_verified", { category: product.category, subCategory: product.subCategory });
  log("reviews_verified", { productId: String(product._id), reviews: product.reviews.length });
  log("video_metadata_verified", { videos: product.videos.length, mediaVideos: product.media.videos.length });

  product.stock = 4;
  await product.save();
  log("products_update", { id: String(product._id), stock: product.stock });

  const coupon = await Coupon.create({
    code: `${tag.toUpperCase()}10`,
    type: "percentage",
    discount: 10,
    maxUses: 3,
    minimumOrder: 100,
    applicableProducts: [product._id],
    oneUsePerUser: true,
  });
  log("coupons_create_read", { id: String(coupon._id), code: coupon.code });

  const order = await Order.create({
    orderId: `${tag}-order`,
    userId: customer._id,
    customerInfo: {
      name: customer.name,
      email: customer.email,
      phone: "9999999999",
    },
    products: [
      {
        productId: product._id,
        title: product.title,
        image: product.images[0].url,
        price: product.discountPrice,
        quantity: 1,
      },
    ],
    shippingAddress: {
      fullName: customer.name,
      phone: "9999999999",
      address: "Launch verification address",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
    couponCode: coupon.code,
    couponDiscount: 150,
    subtotal: 1499,
    total: 1349,
    paymentMethod: "Razorpay",
    paymentStatus: "Pending",
    razorpayOrderId: `${tag}_rzp_order`,
    deliveryStatus: "Pending",
  });
  log("orders_create_read", { id: String(order._id), orderId: order.orderId, paymentStatus: order.paymentStatus });

  order.paymentStatus = "Paid";
  order.razorpayPaymentId = `${tag}_rzp_payment`;
  await order.save();
  log("orders_update_payment", { orderId: order.orderId, paymentStatus: order.paymentStatus });

  coupon.usedCount += 1;
  coupon.usedBy.push(customer._id);
  await coupon.save();
  log("coupons_update_redemption", { code: coupon.code, usedCount: coupon.usedCount });

  await cleanup();
  log("cleanup_complete", { tag });

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(`verification_failed: ${error.name}: ${error.message}`);
  await cleanup().catch(() => undefined);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
