const express = require("express");
const multer = require("multer");
const requireAuth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const noteController = require("../controllers/aiNoteController");
const analysisController = require("../controllers/aiAnalysisController");

const router = express.Router();

// Browser MediaRecorder produces webm; uploads can be much larger than the
// product-image pipeline allows, so recordings get their own memory uploader.
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max aligned with Groq Whisper audio limits
});

const MEDIA_FIELD = "file";
const MEDIA_FILTER = (req, file, cb) => {
  const allowed = [
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/mpeg",
    "audio/wav",
    "video/webm",
    "video/mp4",
    "video/quicktime",
  ];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(new Error(`Unsupported recording format: ${file.mimetype}`));
};
const mediaUpload = memoryUpload.single(MEDIA_FIELD, MEDIA_FILTER);

const { optionalAuth } = require("../src/middleware/auth");
const rateLimit = require("express-rate-limit");

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  message: { success: false, message: "AI rate limit reached. Please wait a minute before analyzing more text." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Voluntary user-controlled text analysis (accessible without mandatory admin privileges, strictly rate-limited)
router.post("/analyze-text", aiRateLimiter, optionalAuth, analysisController.createAnalysis);

// All subsequent AI administration endpoints are authenticated and admin-only.
router.use(requireAuth, adminAuth);

// --- Notes ---
router.get("/notes", noteController.getNotes);
router.get("/notes/:id", noteController.getNote);
router.post("/notes", mediaUpload, noteController.createNote);
router.post("/notes/from-url", noteController.createNoteFromUrl);
router.put("/notes/:id", noteController.updateNote);
router.delete("/notes/:id", noteController.deleteNote);

// --- Transcription only (no note persisted) ---
router.post("/transcribe", mediaUpload, noteController.transcribeOnly);

// --- Analysis ---
// /analysis/transcribe is registered before /analysis/:id so the literal
// segment wins over the param matcher.
router.post(
  "/analysis/transcribe",
  mediaUpload,
  analysisController.transcribeMedia
);
router.get("/analysis", analysisController.getAnalyses);
router.get("/analysis/:id", analysisController.getAnalysis);
router.post("/analysis", analysisController.createAnalysis);
router.put("/analysis/:id", analysisController.updateAnalysis);
router.delete("/analysis/:id", analysisController.deleteAnalysis);

module.exports = router;
