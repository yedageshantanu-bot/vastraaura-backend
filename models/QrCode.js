const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    destination: { type: String, required: true },
    payload: { type: String, required: true },
    kind: {
      type: String,
      enum: ["product", "combo", "page", "collection", "custom"],
      default: "custom",
    },
    sourceRef: { type: String, default: "" },
    sourceRefId: { type: String, default: "" },
    image: { type: String, default: "" },
    size: { type: Number, default: 300 },
    color: { type: String, default: "#0f172a" },
    bgColor: { type: String, default: "#ffffff" },
    viewCount: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

qrCodeSchema.index({ user: 1, createdAt: -1 });
qrCodeSchema.index({ kind: 1, createdAt: -1 });

module.exports = mongoose.models.QrCode || mongoose.model("QrCode", qrCodeSchema);
