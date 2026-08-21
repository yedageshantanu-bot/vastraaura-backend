const mongoose = require("mongoose");

const comboSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, default: "" }, // Can be a URL or local path
    galleryImages: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    ribbon: { type: String, default: "", trim: true }, // E.g., "Cozy Choice"
    savings_pct: { type: Number, default: 0 },
    tagline: { type: String, default: "", trim: true }, // E.g., "FLOWERS + TOYS"
    included: { type: [String], default: [] }, // Array of included item strings
    original_price: { type: Number, required: true, min: 0 }, // MRP
    price: { type: Number, required: true, min: 0 }, // Selling price
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Combo || mongoose.model("Combo", comboSchema);
