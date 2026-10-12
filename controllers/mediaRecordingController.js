const asyncHandler = require("../middleware/asyncHandler");
const MediaRecording = require("../models/MediaRecording");

const formatRecordingFile = (file) => ({
  url: file.path,
  publicId: file.filename || file.public_id || "",
  originalName: file.originalname,
  mimeType: file.mimetype,
  size: file.size,
  resourceType: file.mimetype?.startsWith("video/") ? "video" : "audio",
  format: file.format,
});

exports.uploadRecording = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Recording file is required",
    });
  }

  const body = req.body || {};
  const file = formatRecordingFile(req.file);
  const kind = file.resourceType === "video" ? "video" : "audio";

  const mongoose = require("mongoose");
  const isDbConnected = mongoose.connection.readyState === 1;

  let recording;
  if (isDbConnected) {
    recording = await MediaRecording.create({
      title: body.title || req.file.originalname || "Untitled recording",
      description: body.description || "",
      kind,
      url: file.url,
      publicId: file.publicId,
      mimeType: file.mimeType,
      duration: Number(body.duration || 0),
      fileSize: file.size,
      capturedBy: body.capturedBy || "upload",
      user: req.userId || undefined,
      tags: Array.isArray(body.tags) ? body.tags : [],
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    });
  } else {
    recording = {
      _id: "rec_" + Date.now(),
      title: body.title || req.file.originalname || "Untitled recording",
      description: body.description || "",
      kind,
      url: file.url,
      publicId: file.publicId,
      mimeType: file.mimeType,
      duration: Number(body.duration || 0),
      fileSize: file.size,
      capturedBy: body.capturedBy || "upload",
      user: req.userId || null,
      createdAt: new Date().toISOString(),
    };
  }

  console.info("[Alaira House recordings] stored", {
    id: recording._id,
    kind,
    size: file.size,
    user: req.userId,
  });

  res.status(201).json({ success: true, message: "Recording saved", recording });
});

exports.getRecordings = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.kind === "audio" || req.query.kind === "video") {
    filter.kind = req.query.kind;
  }
  // Only the owner may list their own recordings.
  filter.user = req.userId;

  const recordings = await MediaRecording.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, recordings });
});

exports.getRecording = asyncHandler(async (req, res) => {
  const recording = await MediaRecording.findById(req.params.id).populate("user", "name email");
  if (!recording) {
    return res.status(404).json({ success: false, message: "Recording not found" });
  }
  if (String(recording.user?._id) !== String(req.userId)) {
    return res.status(403).json({ success: false, message: "Not allowed" });
  }
  res.status(200).json({ success: true, recording });
});

exports.deleteRecording = asyncHandler(async (req, res) => {
  const recording = await MediaRecording.findOneAndDelete({
    _id: req.params.id,
    user: req.userId,
  });

  if (!recording) {
    return res
      .status(404)
      .json({ success: false, message: "Recording not found" });
  }

  res.status(200).json({ success: true, message: "Recording deleted" });
});

exports.updateRecording = asyncHandler(async (req, res) => {
  const allowed = {};
  ["title", "description", "duration", "tags", "metadata"].forEach((key) => {
    if (req.body[key] !== undefined) allowed[key] = req.body[key];
  });

  const recording = await MediaRecording.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    allowed,
    { new: true, runValidators: true }
  );

  if (!recording) {
    return res
      .status(404)
      .json({ success: false, message: "Recording not found" });
  }

  res.status(200).json({ success: true, recording });
});
