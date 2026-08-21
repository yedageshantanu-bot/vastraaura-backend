const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const controller = require("../controllers/uploadController");
const { imageUpload, imagesUpload, videoUpload, mixedUpload } = require("../middleware/uploadMiddleware");
const requireAuth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many upload attempts. Please wait a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use((req, res, next) => {
  console.info("[VastraAura upload] route hit", {
    method: req.method,
    path: req.originalUrl,
    contentType: req.headers["content-type"],
    hasCookie: Boolean(req.cookies?.vastraaura_token),
  });
  next();
});

router.post("/image", uploadLimiter, requireAuth, adminAuth, imageUpload.single("image"), controller.uploadSingleImage);
router.post("/images", uploadLimiter, requireAuth, adminAuth, imagesUpload.array("images"), controller.uploadMultipleImages);
router.post("/video", uploadLimiter, requireAuth, adminAuth, videoUpload.single("video"), controller.uploadSingleVideo);
router.post("/mixed", uploadLimiter, requireAuth, adminAuth, mixedUpload.any(), controller.uploadMixedMedia);

module.exports = router;
