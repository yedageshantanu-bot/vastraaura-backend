const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../config/cloudinary");

const IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const VIDEO_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024;

const isAllowedMimeType = (file, allowedTypes) => allowedTypes.includes(file.mimetype);

const folderMap = {
  front: "vastraaura/products/front",
  back: "vastraaura/products/back",
  gallery: "vastraaura/products/gallery",
  images: "vastraaura/products/gallery",
  videos: "vastraaura/products/videos",
  media: "vastraaura/products/gallery",
};

const resolveFolder = (req, fallback) => {
  const requested = String(req.query.folder || req.body.folder || "").trim();
  return folderMap[requested] || fallback;
};

const createStorage = ({ folder, allowedFormats, resourceType, transformation }) =>
  new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: resolveFolder(req, folder),
      resource_type: resourceType,
      allowed_formats: allowedFormats,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      transformation,
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9-_]/gi, "-").toLowerCase()}`,
    }),
  });

const imageStorage = createStorage({
  folder: "vastraaura/products/front",
  allowedFormats: ["jpg", "jpeg", "png", "webp"],
  resourceType: "image",
  transformation: [
    { quality: "auto", fetch_format: "auto" },
    { crop: "limit", width: 1800, height: 1800 },
  ],
});

const videoStorage = createStorage({
  folder: "vastraaura/products/videos",
  allowedFormats: ["mp4", "mov", "webm"],
  resourceType: "video",
  transformation: [
    { quality: "auto", fetch_format: "auto" },
    { crop: "limit", width: 1920, height: 1080 },
  ],
});

const mixedStorage = createStorage({
  folder: "vastraaura/products/media",
  allowedFormats: ["jpg", "jpeg", "png", "webp", "mp4", "mov", "webm"],
  resourceType: "auto",
  transformation: [{ quality: "auto", fetch_format: "auto" }],
});

const createUploader = ({ storage, maxFileSize, allowedMimeTypes, fieldName }) =>
  multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (req, file, cb) => {
      console.info("[VastraAura upload] file received", {
        route: req.originalUrl,
        fieldName: file.fieldname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        requestedFolder: req.query.folder || req.body.folder || "",
      });

      if (isAllowedMimeType(file, allowedMimeTypes)) {
        cb(null, true);
        return;
      }

      cb(
        new Error(`${fieldName} accepts only ${allowedMimeTypes.join(", ")} file types`),
      );
    },
  });

const imageUpload = createUploader({
  storage: imageStorage,
  maxFileSize: MAX_IMAGE_FILE_SIZE,
  allowedMimeTypes: IMAGE_MIME_TYPES,
  fieldName: "image",
});

const imagesUpload = createUploader({
  storage: imageStorage,
  maxFileSize: MAX_IMAGE_FILE_SIZE,
  allowedMimeTypes: IMAGE_MIME_TYPES,
  fieldName: "images",
});

const videoUpload = createUploader({
  storage: videoStorage,
  maxFileSize: MAX_VIDEO_FILE_SIZE,
  allowedMimeTypes: VIDEO_MIME_TYPES,
  fieldName: "video",
});

const mixedUpload = createUploader({
  storage: mixedStorage,
  maxFileSize: MAX_VIDEO_FILE_SIZE,
  allowedMimeTypes: [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES],
  fieldName: "media",
});

module.exports = {
  imageUpload,
  imagesUpload,
  videoUpload,
  mixedUpload,
  productMediaUpload: mixedUpload,
};
