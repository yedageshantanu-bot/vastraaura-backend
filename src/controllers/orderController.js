const Order = require("../../models/Order");
const User = require("../../models/User");
const Coupon = require("../../models/Coupon");
const Product = require("../../models/Product");
const asyncHandler = require("../../middleware/asyncHandler");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const {
  createOrder: createLocalOrder,
  findUserById,
  getOrdersForUser,
  isDbConnected,
} = require("../utils/localStore");
const store = require("../data/store");

const buildOrderId = async () => {
  const count = await Order.countDocuments();
  return `VA${String(count + 1).padStart(5, "0")}`;
};

const requiredAddressFields = ["fullName", "phone", "address", "city", "state", "pincode"];

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const getRazorpayWebhookSecret = () => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Razorpay webhook secret is not configured");
  }
  return secret;
};

const getProductId = (item) => String(item.productId || item._id || "").split(":")[0];

const validateAddress = (address = {}) => {
  const missing = requiredAddressFields.filter((field) => !String(address[field] || "").trim());
  if (missing.length > 0) {
    return `Missing required checkout fields: ${missing.join(", ")}`;
  }

  return "";
};

const calculateCouponDiscount = (subtotal, coupon) => {
  if (!coupon) {
    return 0;
  }

  const discount =
    coupon.type === "percentage"
      ? Math.round((subtotal * Number(coupon.discount || 0)) / 100)
      : Number(coupon.discount || 0);
  const cappedDiscount =
    Number(coupon.maxDiscount || 0) > 0
      ? Math.min(discount, Number(coupon.maxDiscount || 0))
      : discount;

  return Math.min(cappedDiscount, subtotal);
};

const validateAndBuildCheckout = async ({ user, body }) => {
  const { items = [], address = {}, couponCode = "" } = body;

  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("Order items are required");
    error.statusCode = 400;
    throw error;
  }

  const addressError = validateAddress(address);
  if (addressError) {
    const error = new Error(addressError);
    error.statusCode = 400;
    throw error;
  }

  const quantities = new Map();
  items.forEach((item) => {
    const productId = getProductId(item);
    const quantity = Math.max(1, Number(item.quantity || 1));
    if (productId) {
      quantities.set(productId, (quantities.get(productId) || 0) + quantity);
    }
  });

  const productIds = Array.from(quantities.keys());
  const validProductIds = productIds.filter((productId) => mongoose.isValidObjectId(productId));
  const stockQuantities = new Map(
    Array.from(quantities.entries()).filter(([productId]) => validProductIds.includes(productId)),
  );

  const products = await Product.find({ _id: { $in: validProductIds }, isActive: { $ne: false } }).select(
    "_id title images thumbnail price discountPrice stock",
  );
  const lookup = new Map(products.map((product) => [String(product._id), product]));

  if (lookup.size !== validProductIds.length) {
    const error = new Error("One or more cart items are no longer available");
    error.statusCode = 400;
    throw error;
  }

  const outOfStock = validProductIds.find((productId) => Number(lookup.get(productId).stock || 0) < stockQuantities.get(productId));
  if (outOfStock) {
    const error = new Error(`${lookup.get(outOfStock).title} does not have enough stock`);
    error.statusCode = 400;
    throw error;
  }

  const orderProducts = items.map((item) => {
    const productId = getProductId(item);
    const product = lookup.get(productId);
    const quantity = Math.max(1, Number(item.quantity || 1));
    const price = Number(product?.discountPrice || product?.price || item.discountPrice || item.price || 0);

    return {
      productId: product?._id,
      title: product?.title || item.title || "Alaira product",
      image: item.image || product?.thumbnail?.url || product?.images?.[0]?.url || "",
      price,
      quantity,
      size: item.size || "",
      color: item.color || "",
    };
  });

  const subtotal = orderProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let coupon = null;
  let couponDiscount = 0;
  const normalizedCouponCode = String(couponCode || "").trim().toUpperCase();

  if (normalizedCouponCode) {
    coupon = await Coupon.findOne({ code: normalizedCouponCode });
    const couponInvalid =
      !coupon ||
      !coupon.isActive ||
      (coupon.expiryDate && coupon.expiryDate < new Date()) ||
      (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) ||
      subtotal < Number(coupon.minimumOrder || 0) ||
      (coupon.oneUsePerUser && coupon.usedBy.map(String).includes(String(user._id)));

    if (couponInvalid) {
      const error = new Error("Coupon is invalid or expired");
      error.statusCode = 400;
      throw error;
    }

    if (coupon.applicableProducts.length > 0) {
      const applicableIds = coupon.applicableProducts.map(String);
      const hasApplicableProduct = validProductIds.some((productId) => applicableIds.includes(productId));
      if (!hasApplicableProduct) {
        const error = new Error("Coupon is not valid for these products");
        error.statusCode = 400;
        throw error;
      }
    }

    couponDiscount = calculateCouponDiscount(subtotal, coupon);
  }

  const payableBeforeShipping = Math.max(subtotal - couponDiscount, 0);
  const shipping =
    payableBeforeShipping >= 999 || payableBeforeShipping === 0 || payableBeforeShipping === 1
      ? 0
      : 99;
  const total = payableBeforeShipping + shipping;

  return {
    address,
    coupon,
    couponCode: normalizedCouponCode,
    couponDiscount,
    orderProducts,
    productIds: validProductIds,
    quantities: stockQuantities,
    subtotal,
    total,
  };
};

const finalizeOrder = async ({ user, checkout, payment }) => {
  const existing = await Order.findOne({
    $or: [
      { razorpayPaymentId: payment.razorpay_payment_id },
      { razorpayOrderId: payment.razorpay_order_id },
    ],
  });

  if (existing) {
    const wasAlreadyPaid = existing.paymentStatus === "Paid";
    existing.paymentStatus = "Paid";
    existing.razorpayPaymentId = payment.razorpay_payment_id || existing.razorpayPaymentId;
    existing.razorpayOrderId = payment.razorpay_order_id || existing.razorpayOrderId;
    existing.customerInfo = {
      name: checkout.address.fullName || user.name,
      email: user.email,
      phone: checkout.address.phone || user.phone || "",
    };
    existing.products = checkout.orderProducts;
    existing.shippingAddress = checkout.address;
    existing.couponCode = checkout.couponCode || "";
    existing.couponDiscount = checkout.couponDiscount;
    existing.subtotal = checkout.subtotal;
    existing.total = checkout.total;
    await existing.save();

    if (!wasAlreadyPaid) {
      if (checkout.coupon) {
        checkout.coupon.usedCount += 1;
        if (checkout.coupon.oneUsePerUser) {
          checkout.coupon.usedBy = Array.from(
            new Set([...checkout.coupon.usedBy.map(String), String(user._id)]),
          );
        }
        await checkout.coupon.save();
      }

      await Promise.all(
        Array.from(checkout.quantities.entries()).map(([productId, quantity]) =>
          Product.updateOne(
            { _id: productId, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
          ),
        ),
      );
    }

    return existing;
  }

  const order = await Order.create({
    orderId: await buildOrderId(),
    userId: user._id,
    customerInfo: {
      name: checkout.address.fullName || user.name,
      email: user.email,
      phone: checkout.address.phone || user.phone || "",
    },
    products: checkout.orderProducts,
    shippingAddress: checkout.address,
    couponCode: checkout.couponCode || "",
    couponDiscount: checkout.couponDiscount,
    subtotal: checkout.subtotal,
    total: checkout.total,
    paymentMethod: "Razorpay",
    paymentStatus: "Paid",
    razorpayOrderId: payment.razorpay_order_id,
    razorpayPaymentId: payment.razorpay_payment_id,
    deliveryStatus: "Pending",
  });

  if (checkout.coupon) {
    checkout.coupon.usedCount += 1;
    if (checkout.coupon.oneUsePerUser) {
      checkout.coupon.usedBy = Array.from(
        new Set([...checkout.coupon.usedBy.map(String), String(user._id)]),
      );
    }
    await checkout.coupon.save();
  }

  await Promise.all(
    Array.from(checkout.quantities.entries()).map(([productId, quantity]) =>
      Product.updateOne(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
      ),
    ),
  );

  return order;
};

const formatOrder = (order) => ({
  ...order,
  userId: order.userId ? String(order.userId._id || order.userId) : undefined,
});

exports.getOrders = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    const orders = (req.auth?.role === "admin" ? store.orders : getOrdersForUser(req.userId))
      .filter((order) => order.paymentStatus !== "Pending");
    return res.json({ success: true, count: orders.length, orders });
  }

  const baseQuery = req.auth?.role === "admin" ? {} : { userId: req.userId };
  const query = {
    ...baseQuery,
    paymentStatus: { $ne: "Pending" },
  };

  const orders = await Order.find(query)
    .populate("userId", "name email profileImage role")
    .populate("products.productId", "title images thumbnail discountPrice")
    .sort({ createdAt: -1 })
    .lean();

  return res.json({ success: true, count: orders.length, orders });
});

exports.getMyOrders = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    const orders = getOrdersForUser(req.userId).filter((order) => order.paymentStatus !== "Pending");
    return res.json({ success: true, count: orders.length, orders });
  }

  const orders = await Order.find({
    userId: req.userId,
    paymentStatus: { $ne: "Pending" },
  })
    .populate("products.productId", "title images thumbnail discountPrice")
    .sort({ createdAt: -1 })
    .lean();

  return res.json({ success: true, count: orders.length, orders });
});

exports.getOrder = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    const order = store.orders.find((item) => String(item._id) === String(req.params.id));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (
      req.auth?.role !== "admin" &&
      String(order.userId || "") !== String(req.userId) &&
      findUserById(req.userId)?.email !== order.userEmail
    ) {
      return res.status(403).json({ error: "Order access denied" });
    }

    if (order.paymentStatus === "Pending") {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json({ success: true, order });
  }

  const order = await Order.findById(req.params.id)
    .populate("userId", "name email profileImage role")
    .populate("products.productId", "title images thumbnail discountPrice")
    .lean();

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (order.paymentStatus === "Pending") {
    return res.status(404).json({ error: "Order not found" });
  }

  if (req.auth?.role !== "admin" && String(order.userId?._id || order.userId) !== String(req.userId)) {
    return res.status(403).json({ error: "Order access denied" });
  }

  return res.json({ success: true, order: formatOrder(order) });
});

exports.createRazorpayOrder = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: "Database connection is required for live payments" });
  }

  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const checkout = await validateAndBuildCheckout({ user, body: req.body });
  const razorpay = getRazorpay();
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(checkout.total * 100),
    currency: "INR",
    receipt: `rcpt_${Date.now()}_${String(user._id).slice(-6)}`,
    notes: {
      userId: String(user._id),
      customerName: checkout.address.fullName,
    },
  });

  await Order.findOneAndUpdate(
    { razorpayOrderId: razorpayOrder.id },
    {
      $setOnInsert: {
        orderId: await buildOrderId(),
        userId: user._id,
        customerInfo: {
          name: checkout.address.fullName || user.name,
          email: user.email,
          phone: checkout.address.phone || user.phone || "",
        },
        products: checkout.orderProducts,
        shippingAddress: checkout.address,
        couponCode: checkout.couponCode || "",
        couponDiscount: checkout.couponDiscount,
        subtotal: checkout.subtotal,
        total: checkout.total,
        paymentMethod: "Razorpay",
        paymentStatus: "Pending",
        razorpayOrderId: razorpayOrder.id,
        deliveryStatus: "Pending",
      },
    },
    { upsert: true, new: true },
  );

  return res.status(201).json({
    success: true,
    keyId: process.env.RAZORPAY_KEY_ID,
    razorpayOrder: {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    },
    amount: checkout.total,
    customer: {
      name: checkout.address.fullName || user.name,
      email: user.email,
      contact: checkout.address.phone || user.phone || "",
    },
  });
});

exports.verifyRazorpayPayment = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: "Database connection is required for live payments" });
  }

  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Razorpay payment details are required" });
  }

  const razorpay = getRazorpay();
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  const signatureMatches =
    expectedSignature.length === String(razorpay_signature).length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(String(razorpay_signature)));

  if (!signatureMatches) {
    return res.status(400).json({ error: "Payment verification failed" });
  }

  const [razorpayOrder, razorpayPayment] = await Promise.all([
    razorpay.orders.fetch(razorpay_order_id),
    razorpay.payments.fetch(razorpay_payment_id),
  ]);

  if (
    razorpayPayment.order_id !== razorpay_order_id ||
    !["captured", "authorized"].includes(razorpayPayment.status)
  ) {
    return res.status(400).json({ error: "Payment was not completed" });
  }

  const checkout = await validateAndBuildCheckout({ user, body: req.body.orderData || {} });
  if (Number(razorpayOrder.amount) !== Math.round(checkout.total * 100)) {
    return res.status(400).json({ error: "Payment amount does not match the order total" });
  }

  const order = await finalizeOrder({
    user,
    checkout,
    payment: { razorpay_order_id, razorpay_payment_id },
  });

  return res.status(201).json({ success: true, order });
});

exports.handleRazorpayWebhook = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: "Database connection is required for payment webhooks" });
  }

  const signature = req.headers["x-razorpay-signature"];
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  const expectedSignature = crypto
    .createHmac("sha256", getRazorpayWebhookSecret())
    .update(rawBody)
    .digest("hex");

  if (
    !signature ||
    expectedSignature.length !== String(signature).length ||
    !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(String(signature)))
  ) {
    return res.status(400).json({ error: "Invalid Razorpay webhook signature" });
  }

  const event = JSON.parse(rawBody.toString("utf8"));
  const payment = event.payload?.payment?.entity || {};
  const refund = event.payload?.refund?.entity || {};
  const razorpayOrderId = payment.order_id || refund.order_id || "";
  const razorpayPaymentId = payment.id || refund.payment_id || "";

  if (["payment.captured", "payment.authorized"].includes(event.event)) {
    await Order.findOneAndUpdate(
      { razorpayOrderId },
      {
        paymentStatus: "Paid",
        razorpayPaymentId,
      },
      { new: true },
    );
  }

  if (["payment.failed"].includes(event.event)) {
    await Order.findOneAndUpdate(
      { razorpayOrderId },
      {
        paymentStatus: "Failed",
        razorpayPaymentId,
      },
      { new: true },
    );
  }

  if (["refund.created", "refund.processed"].includes(event.event)) {
    await Order.findOneAndUpdate(
      {
        $or: [
          { razorpayPaymentId },
          { razorpayOrderId },
        ],
      },
      { paymentStatus: "Refunded" },
      { new: true },
    );
  }

  return res.json({ success: true, received: true });
});

exports.updateDeliveryStatus = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    const order = store.orders.find((item) => String(item._id) === String(req.params.id));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const allowedStatuses = ["Pending", "Packed", "Shipped", "Delivered", "Cancelled"];
    if (!allowedStatuses.includes(req.body.deliveryStatus)) {
      return res.status(400).json({ error: "Invalid delivery status" });
    }

    order.deliveryStatus = req.body.deliveryStatus;
    order.updatedAt = new Date().toISOString();

    return res.json({ success: true, order });
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const allowedStatuses = ["Pending", "Packed", "Shipped", "Delivered", "Cancelled"];
  if (!allowedStatuses.includes(req.body.deliveryStatus)) {
    return res.status(400).json({ error: "Invalid delivery status" });
  }

  order.deliveryStatus = req.body.deliveryStatus;
  await order.save();

  return res.json({ success: true, order });
});
