const mongoose = require("mongoose");

// Order documents store checkout, payment, and shipping information.
const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        title: { type: String, required: true },
        image: { type: String, default: "" },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        size: { type: String, default: "" },
        color: { type: String, default: "" },
      },
    ],
    customerInfo: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      landmark: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    couponCode: { type: String, default: "" },
    couponDiscount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["Razorpay"],
      default: "Razorpay",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    deliveryStatus: {
      type: String,
      enum: ["Pending", "Packed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

orderSchema.pre("save", async function autoOrderId() {
  if (!this.orderId) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderId = `VA${String(count + 1).padStart(5, "0")}`;
  }
});

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
