require("dotenv").config();

const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const { handleRazorpayWebhook } = require("../src/controllers/orderController");

const tag = `codex-webhook-${Date.now()}`;
process.env.RAZORPAY_WEBHOOK_SECRET =
  process.env.RAZORPAY_WEBHOOK_SECRET || `${tag}-local-signature-secret`;

const invokeWebhook = (event) =>
  new Promise((resolve, reject) => {
    const rawBody = Buffer.from(JSON.stringify(event));
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    const req = {
      body: rawBody,
      headers: { "x-razorpay-signature": signature },
    };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ statusCode: this.statusCode, payload });
      },
    };

    handleRazorpayWebhook(req, res, reject);
  });

const cleanup = async () => {
  await Promise.allSettled([
    Order.deleteMany({ orderId: new RegExp(`^${tag}`) }),
    User.deleteMany({ email: `${tag}@example.com` }),
  ]);
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS || 15000),
  });

  await cleanup();

  const user = await User.create({
    name: "Codex Webhook Customer",
    email: `${tag}@example.com`,
    authProvider: "local",
    passwordHash: "not-used",
  });

  const order = await Order.create({
    orderId: `${tag}-order`,
    userId: user._id,
    products: [{ title: "Webhook Product", price: 100, quantity: 1 }],
    customerInfo: { name: user.name, email: user.email, phone: "9999999999" },
    shippingAddress: {
      fullName: user.name,
      phone: "9999999999",
      address: "Webhook verification address",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
    subtotal: 100,
    total: 100,
    paymentStatus: "Pending",
    razorpayOrderId: `${tag}_order`,
  });

  const captured = await invokeWebhook({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: `${tag}_payment`,
          order_id: order.razorpayOrderId,
          status: "captured",
        },
      },
    },
  });
  const paidOrder = await Order.findById(order._id).lean();

  const failed = await invokeWebhook({
    event: "payment.failed",
    payload: {
      payment: {
        entity: {
          id: `${tag}_payment_failed`,
          order_id: order.razorpayOrderId,
          status: "failed",
        },
      },
    },
  });
  const failedOrder = await Order.findById(order._id).lean();

  const refunded = await invokeWebhook({
    event: "refund.processed",
    payload: {
      refund: {
        entity: {
          id: `${tag}_refund`,
          payment_id: `${tag}_payment_failed`,
          order_id: order.razorpayOrderId,
        },
      },
    },
  });
  const refundedOrder = await Order.findById(order._id).lean();

  console.log(
    JSON.stringify({
      signatureValidation: captured.statusCode === 200,
      capturedStatus: paidOrder.paymentStatus,
      failedStatus: failedOrder.paymentStatus,
      refundedStatus: refundedOrder.paymentStatus,
      responses: {
        captured: captured.payload,
        failed: failed.payload,
        refunded: refunded.payload,
      },
    }),
  );

  await cleanup();
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(`webhook_verification_failed: ${error.name}: ${error.message}`);
  await cleanup().catch(() => undefined);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
