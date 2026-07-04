const asyncHandler = require("../middleware/asyncHandler");

const buildVideoThumbnailUrl = (url) => {
  if (!url || !url.includes("/upload/")) {
    return "";
  }

  return url.replace("/upload/", "/upload/so_0,w_900,h_1200,c_fill,f_auto/");
};

const formatCloudinaryFile = (file) => ({
  url: file.path,
  publicId: file.filename || file.public_id || "",
  originalName: file.originalname,
  mimeType: file.mimetype,
  size: file.size,
  resourceType: file.mimetype?.startsWith("video/") ? "video" : "image",
  format: file.format,
  thumbnailUrl: file.mimetype?.startsWith("video/") ? buildVideoThumbnailUrl(file.path) : "",
});

exports.uploadSingleImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    console.error("[VastraAura upload] no image file received");
    return res.status(400).json({ success: false, message: "Image file is required" });
  }

  console.info("[VastraAura upload] cloudinary image upload success", formatCloudinaryFile(req.file));
  res.status(201).json({
    success: true,
    message: "Image uploaded successfully",
    file: formatCloudinaryFile(req.file),
  });
});

exports.uploadMultipleImages = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) {
    console.error("[VastraAura upload] no gallery image files received");
    return res.status(400).json({ success: false, message: "At least one image is required" });
  }

  console.info("[VastraAura upload] cloudinary gallery upload success", req.files.map(formatCloudinaryFile));
  res.status(201).json({
    success: true,
    message: "Images uploaded successfully",
    files: req.files.map(formatCloudinaryFile),
  });
});

exports.uploadSingleVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    console.error("[VastraAura upload] no video file received");
    return res.status(400).json({ success: false, message: "Video file is required" });
  }

  console.info("[VastraAura upload] cloudinary video upload success", formatCloudinaryFile(req.file));
  res.status(201).json({
    success: true,
    message: "Video uploaded successfully",
    file: formatCloudinaryFile(req.file),
  });
});

exports.uploadMixedMedia = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) {
    console.error("[VastraAura upload] no mixed media files received");
    return res.status(400).json({ success: false, message: "At least one media file is required" });
  }

  const images = [];
  const videos = [];

  req.files.forEach((file) => {
    const payload = formatCloudinaryFile(file);

    if (file.mimetype.startsWith("video/")) {
      videos.push(payload);
      return;
    }

    images.push(payload);
  });

  res.status(201).json({
    success: true,
    message: "Media uploaded successfully",
    images,
    videos,
  });
});
