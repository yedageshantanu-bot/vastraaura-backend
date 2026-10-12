const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../config/cloudinary");

// Audio produced by the browser MediaRecorder (webm/ogg/mp4) and the video
// formats the existing upload pipeline already accepts.
const AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "video/webm",
];
const VIDEO_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED_MIME_TYPES = [...AUDIO_MIME_TYPES, ...VIDEO_MIME_TYPES];

const MAX_MEDIA_FILE_SIZE = 35 * 1024 * 1024; // 35 MB (safe limit for 60-90s gift media)

const recordingStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: process.env.CLOUDINARY_FOLDER || "alaira/recordings",
    // In Cloudinary, all audio and video formats use resource_type: "video"
    resource_type: "video",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    public_id: `${Date.now()}-${file.originalname
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9-_]/gi, "-")
      .toLowerCase()}`,
  }),
});

const recordingUpload = multer({
  storage: recordingStorage,
  limits: { fileSize: MAX_MEDIA_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(
      new Error(
        `Recording accepts only audio (${AUDIO_MIME_TYPES.join(", ")}) or video (${VIDEO_MIME_TYPES.join(", ")}) formats`
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
};
