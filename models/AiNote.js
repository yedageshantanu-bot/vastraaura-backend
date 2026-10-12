const mongoose = require("mongoose");

const aiNoteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    summary: { type: String, default: "" },
    keyPoints: { type: [String], default: [] },
    actionItems: { type: [String], default: [] },
    headings: { type: [String], default: [] },
    transcription: { type: String, default: "" },
    sourceType: {
      type: String,
      enum: ["manual", "audio", "video", "file"],
      default: "manual",
    },
    sourceFileUrl: { type: String, default: "" },
    sourceFileName: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    mimeType: { type: String, default: "" },
    aiModel: { type: String, default: "" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tags: { type: [String], default: [] },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

aiNoteSchema.index({ user: 1, updatedAt: -1 });
aiNoteSchema.index({ content: "text", transcription: "text", title: "text" });

module.exports = mongoose.models.AiNote || mongoose.model("AiNote", aiNoteSchema);
