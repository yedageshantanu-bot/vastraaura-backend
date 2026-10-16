const express = require("express");
const requireAuth = require("../middleware/auth");
const { optionalAuth } = require("../src/middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const controller = require("../controllers/mediaRecordingController");
const { recordingUpload } = require("../middleware/recordingUpload");
const rateLimit = require("express-rate-limit");

const recordingUploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { success: false, message: "Too many upload attempts. Please wait a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

// Customer/guest upload for gift video/audio recordings attached to orders
router.post("/upload", recordingUploadLimiter, optionalAuth, recordingUpload.single("recording"), controller.uploadRecording);

// Admin-only management endpoints
router.post("/", requireAuth, adminAuth, recordingUpload.single("recording"), controller.uploadRecording);
router.get("/", requireAuth, adminAuth, controller.getRecordings);
router.get("/:id", requireAuth, adminAuth, controller.getRecording);
router.put("/:id", requireAuth, adminAuth, controller.updateRecording);
router.delete("/:id", requireAuth, adminAuth, controller.deleteRecording);

module.exports = router;
