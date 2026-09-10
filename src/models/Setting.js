const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "global_store_settings",
      unique: true,
      index: true,
    },
    storeName: {
      type: String,
      default: "ALAIRA HOUSE",
    },
    supportEmail: {
      type: String,
      default: "support@alairahouse.com",
    },
    supportPhone: {
      type: String,
      default: "+91 78419 28485",
    },
    currency: {
      type: String,
      default: "INR (₹)",
    },
    freeShippingThreshold: {
      type: Number,
      default: 999,
    },
    standardShippingFee: {
      type: Number,
      default: 99,
    },
    whatsappAlerts: {
      type: Boolean,
      default: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Setting || mongoose.model("Setting", settingSchema);
