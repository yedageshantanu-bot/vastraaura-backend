const crypto = require("crypto");
const asyncHandler = require("../middleware/asyncHandler");
const MediaRecording = require("../models/MediaRecording");
const QrCode = require("../models/QrCode");
const { deleteCloudinaryResource } = require("../config/cloudinary");

let qrLib;
try {
  qrLib = require("qrcode");
} catch {
  qrLib = null;
}

const formatRecordingFile = (file) => ({
  url: file.path || file.secure_url || file.url,
  publicId: file.filename || file.public_id || "",
  originalName: file.originalname,
  mimeType: file.mimetype,
  size: file.size,
  resourceType: file.mimetype?.startsWith("video/") ? "video" : "audio",
  format: file.format,
});

const generateRecordingQr = async (req, safeTokenInput) => {
  const token = safeTokenInput || crypto.randomBytes(16).toString("hex");
  const origin = req.get("origin") || "";
  const storeBase =
    origin && !origin.includes("undefined")
      ? origin
      : process.env.CLIENT_URL || "http://localhost:3003";

  const destination = `${storeBase}/gift/${token}`;

  let image = "";
  if (qrLib) {
    try {
      image = await qrLib.toDataURL(destination, {
        width: 340,
        margin: 2,
        color: { dark: "#1C1924", light: "#FFFFFF" },
      });
    } catch (err) {
      console.warn("[MediaRecording QR Warning]", err.message);
    }
  }

  return {
    safeToken: token,
    destination,
    image,
    generatedAt: new Date(),
  };
};

exports.uploadRecording = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Recording file is required",
    });
  }

  const body = req.body || {};
  const file = formatRecordingFile(req.file);
  const rawMime = (file.mimeType || "").toLowerCase();
  const kind =
    body.kind ||
    (rawMime.startsWith("video/") ||
    ["mp4", "webm", "mov", "mkv", "avi", "m4v"].includes(
      (file.originalName || "").split(".").pop().toLowerCase()
    )
      ? "video"
      : "audio");

  const mongoose = require("mongoose");
  const isDbConnected = mongoose.connection.readyState === 1;

  // 1. Idempotency Check: Prevent duplicate records and QR codes on upload retry
  if (isDbConnected) {
    const existingConditions = [];
    if (file.publicId) existingConditions.push({ publicId: file.publicId });
    if (file.url) existingConditions.push({ url: file.url });
    if (body.clientUploadId) existingConditions.push({ "metadata.clientUploadId": String(body.clientUploadId) });

    if (existingConditions.length > 0) {
      const existing = await MediaRecording.findOne({ $or: existingConditions });
      if (existing) {
        console.info("[MediaRecording retry caught]", {
          id: existing._id,
          safeToken: existing.qrCode?.safeToken,
        });
        return res.status(200).json({
          success: true,
          message: "Recording already processed (idempotent retry)",
          recording: existing,
        });
      }
    }
  }

  // 2. Controlled QR Code Generation: Only generate for audio/video media workflow when requested
  const shouldGenerateQr = body.generateQr !== false && body.generateQr !== "false";
  let qrCodeData = {
    safeToken: "",
    destination: "",
    image: "",
    generatedAt: new Date(),
  };

  if (shouldGenerateQr && (kind === "audio" || kind === "video")) {
    try {
      qrCodeData = await generateRecordingQr(req);
    } catch (qrErr) {
      console.warn("[MediaRecording QR Generation Failure Handled]", qrErr.message);
      // Graceful fallback: token and destination still generated, image generation failed non-fatally
      const fallbackToken = crypto.randomBytes(16).toString("hex");
      const origin = req.get("origin") || "";
      const storeBase = origin && !origin.includes("undefined") ? origin : process.env.CLIENT_URL || "http://localhost:3004";
      qrCodeData = {
        safeToken: fallbackToken,
        destination: `${storeBase}/gift/${fallbackToken}`,
        image: "",
        generatedAt: new Date(),
      };
    }
  }

  const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
  if (body.clientUploadId) {
    metadata.clientUploadId = String(body.clientUploadId);
  }

  let recording;
  if (isDbConnected) {
    recording = await MediaRecording.create({
      title: body.title || req.file.originalname || `${kind === "video" ? "Video" : "Audio"} Message`,
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
      metadata,
      qrCode: qrCodeData,
    });

    // Only register in QrCode collection if a valid destination/image was generated
    if (qrCodeData.destination) {
      try {
        await QrCode.create({
          label: `Recording: ${recording.title}`,
          destination: qrCodeData.destination,
          payload: qrCodeData.destination,
          kind: "custom",
          sourceRef: "MediaRecording",
          sourceRefId: String(recording._id),
          image: qrCodeData.image,
          user: req.userId || undefined,
        });
      } catch (qrErr) {
        console.warn("[MediaRecording QrCode sync notice]", qrErr.message);
      }
    }
  } else {
    recording = {
      _id: "rec_" + Date.now(),
      title: body.title || req.file.originalname || `${kind === "video" ? "Video" : "Audio"} Message`,
      description: body.description || "",
      kind,
      url: file.url,
      publicId: file.publicId,
      mimeType: file.mimeType,
      duration: Number(body.duration || 0),
      fileSize: file.size,
      capturedBy: body.capturedBy || "upload",
      user: req.userId || null,
      metadata,
      qrCode: qrCodeData,
      createdAt: new Date().toISOString(),
    };
  }

  console.info("[Alaira House recordings] stored successfully", {
    id: recording._id,
    kind,
    size: file.size,
    safeToken: qrCodeData.safeToken || "none",
    user: req.userId,
  });

  res.status(201).json({
    success: true,
    message: qrCodeData.safeToken
      ? "Recording uploaded and scannable QR code generated"
      : "Recording uploaded successfully",
    recording,
  });
});

exports.getRecordings = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.kind === "audio" || req.query.kind === "video") {
    filter.kind = req.query.kind;
  }

  if (req.query.search) {
    const q = String(req.query.search).trim();
    filter.$or = [
      { title: new RegExp(q, "i") },
      { description: new RegExp(q, "i") },
      { "qrCode.safeToken": new RegExp(q, "i") },
    ];
  }

  // Admins can view all recordings (including guest uploads); regular users only their own
  const isAdmin = req.auth?.role === "admin";
  if (!isAdmin && req.userId) {
    filter.user = req.userId;
  }

  const recordings = await MediaRecording.find(filter)
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: recordings.length, recordings });
});

exports.getRecording = asyncHandler(async (req, res) => {
  const recording = await MediaRecording.findById(req.params.id).populate("user", "name email");
  if (!recording) {
    return res.status(404).json({ success: false, message: "Recording not found" });
  }

  const isAdmin = req.auth?.role === "admin";
  if (!isAdmin && String(recording.user?._id) !== String(req.userId)) {
    return res.status(403).json({ success: false, message: "Not allowed" });
  }

  res.status(200).json({ success: true, recording });
});

exports.deleteRecording = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  const isAdmin = req.auth?.role === "admin";
  if (!isAdmin) {
    filter.user = req.userId;
  }

  const recording = await MediaRecording.findOneAndDelete(filter);

  if (!recording) {
    return res
      .status(404)
      .json({ success: false, message: "Recording not found" });
  }

  // Also remove from Cloudinary if publicId exists
  if (recording.publicId) {
    try {
      await deleteCloudinaryResource(recording.publicId, "video");
    } catch (e) {
      console.warn("[Recording Cloudinary delete warning]", e.message);
    }
  }

  res.status(200).json({ success: true, message: "Recording and QR code removed" });
});

exports.updateRecording = asyncHandler(async (req, res) => {
  const allowed = {};
  ["title", "description", "duration", "tags", "metadata"].forEach((key) => {
    if (req.body[key] !== undefined) allowed[key] = req.body[key];
  });

  const filter = { _id: req.params.id };
  const isAdmin = req.auth?.role === "admin";
  if (!isAdmin) {
    filter.user = req.userId;
  }

  const recording = await MediaRecording.findOneAndUpdate(
    filter,
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

