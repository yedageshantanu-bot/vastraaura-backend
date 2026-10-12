const mongoose = require("mongoose");

const mediaRecordingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    kind: { type: String, enum: ["audio", "video"], required: true },
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    fileSize: { type: Number, default: 0 },
    capturedBy: { type: String, default: "" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    linkedNote: { type: mongoose.Schema.Types.ObjectId, ref: "AiNote" },
    tags: { type: [String], default: [] },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

mediaRecordingSchema.index({ user: 1, createdAt: -1 });
mediaRecordingSchema.index({ kind: 1, createdAt: -1 });

module.exports =
  mongoose.models.MediaRecording ||
  mongoose.model("MediaRecording", mediaRecordingSchema);
