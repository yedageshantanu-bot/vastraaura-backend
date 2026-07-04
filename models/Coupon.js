const mongoose = require("mongoose");

// Coupon documents keep discount rules and redemption tracking.
const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    discount: { type: Number, required: true },
    maxDiscount: { type: Number, default: null },
    maxUses: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    expiryDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    minimumOrder: { type: Number, default: 0 },
    applicableProducts: [{ type: String, trim: true }],
    oneUsePerUser: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
