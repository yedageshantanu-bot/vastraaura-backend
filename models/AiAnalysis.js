const mongoose = require("mongoose");

const aiAnalysisSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: "" },
    insights: { type: [String], default: [] },
    observations: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    rawInput: { type: String, default: "" },
    sourceType: {
      type: String,
      enum: ["notes", "recordings", "text", "file", "products"],
      default: "text",
    },
    sourceRef: { type: String, default: "" },
    sourceRefId: { type: String, default: "" },
    aiModel: { type: String, default: "" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

aiAnalysisSchema.index({ user: 1, updatedAt: -1 });
aiAnalysisSchema.index({ title: "text", summary: "text", insights: "text" });

module.exports =
  mongoose.models.AiAnalysis || mongoose.model("AiAnalysis", aiAnalysisSchema);
