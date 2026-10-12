const express = require("express");
const requireAuth = require("../middleware/auth");
const { optionalAuth } = require("../src/middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const controller = require("../controllers/mediaRecordingController");
const { recordingUpload } = require("../middleware/recordingUpload");

const router = express.Router();

// Customer/guest upload for gift video/audio recordings attached to orders
router.post("/upload", optionalAuth, recordingUpload.single("recording"), controller.uploadRecording);

// Admin-only management endpoints
router.post("/", requireAuth, adminAuth, recordingUpload.single("recording"), controller.uploadRecording);
router.get("/", requireAuth, adminAuth, controller.getRecordings);
router.get("/:id", requireAuth, adminAuth, controller.getRecording);
router.put("/:id", requireAuth, adminAuth, controller.updateRecording);
router.delete("/:id", requireAuth, adminAuth, controller.deleteRecording);

module.exports = router;
