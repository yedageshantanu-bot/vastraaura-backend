const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../config/cloudinary");

// Audio produced by the browser MediaRecorder (webm/ogg/mp4) and the video
// formats the existing upload pipeline already accepts.
const ALLOWED_EXTENSIONS = new Set([
  "webm",
  "mp4",
  "mov",
  "mkv",
  "avi",
  "m4v",
  "3gp",
  "ogv",
  "mp3",
  "wav",
  "ogg",
  "m4a",
  "aac",
  "weba",
]);

const AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/m4a",
  "audio/x-m4a",
];

const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/avi",
  "video/x-msvideo",
  "video/ogg",
  "video/3gpp",
  "video/3gpp2",
];

const ALLOWED_MIME_TYPES = [...AUDIO_MIME_TYPES, ...VIDEO_MIME_TYPES];

const MAX_MEDIA_FILE_SIZE = 100 * 1024 * 1024; // 100 MB limit for high-def videos and recorded files

const recordingStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const rawExt = (file.originalname || "").split(".").pop().toLowerCase();
    const cleanBaseMime = (file.mimetype || "").split(";")[0].trim().toLowerCase();
    const isVideo = cleanBaseMime.startsWith("video/") || ["mp4", "webm", "mov", "mkv", "avi", "m4v"].includes(rawExt);

    return {
      folder: process.env.CLOUDINARY_FOLDER || "alaira/recordings",
      // "auto" lets Cloudinary automatically detect video vs audio streams without codec mismatch
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      public_id: `${Date.now()}-${(file.originalname || "recording")
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-z0-9-_]/gi, "-")
        .toLowerCase()
        .slice(0, 45)}`,
    };
  },
});

const recordingUpload = multer({
  storage: recordingStorage,
  limits: { fileSize: MAX_MEDIA_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const rawMime = (file.mimetype || "").toLowerCase().trim();
    const baseMime = rawMime.split(";")[0].trim();
    const ext = (file.originalname || "").split(".").pop().toLowerCase();
    const hasAllowedExt = ALLOWED_EXTENSIONS.has(ext);

    const isExplicitAudioOrVideoMime =
      baseMime.startsWith("video/") ||
      baseMime.startsWith("audio/") ||
      baseMime === "application/ogg" ||
      baseMime === "application/x-matroska" ||
      ALLOWED_MIME_TYPES.includes(baseMime);

    if (isExplicitAudioOrVideoMime || (baseMime === "application/octet-stream" && hasAllowedExt)) {
      return cb(null, true);
    }

    return cb(
      new Error(
        `Unsupported format (${file.mimetype}). Please upload standard video (MP4, WebM, MOV) or audio recording.`
      )
    );
  },
});

const audioRecordingUpload = recordingUpload.single("recording");
const videoRecordingUpload = recordingUpload.single("recording");

module.exports = {
  recordingStorage,
  recordingUpload,
  audioRecordingUpload,
  videoRecordingUpload,
  MAX_MEDIA_FILE_SIZE,
  AUDIO_MIME_TYPES,
  VIDEO_MIME_TYPES,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
};

