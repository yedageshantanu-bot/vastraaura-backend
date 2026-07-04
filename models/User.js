const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    googleId: { type: String, unique: true, sparse: true },
    passwordHash: { type: String, default: "" },
    authProvider: {
      type: String,
      enum: ["google", "local", "hybrid"],
      default: "google",
    },
    provider: {
      type: String,
      enum: ["google", "local", "hybrid"],
      default: "google",
    },
    profileImage: { type: String, default: "" },
    avatar: { type: String, default: "" },
    phone: { type: String },
    addresses: [
      {
        label: String,
        fullName: String,
        phone: String,
        address: String,
        landmark: String,
        city: String,
        state: String,
        pincode: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    resetPasswordTokenHash: { type: String, default: "" },
    resetPasswordExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.pre("validate", function syncProvider(next) {
  const provider = this.provider || this.authProvider || "google";
  this.provider = provider;
  this.authProvider = this.authProvider || provider;
  this.avatar = this.avatar || this.profileImage || "";
  next();
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
