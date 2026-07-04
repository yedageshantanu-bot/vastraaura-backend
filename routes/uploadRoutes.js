const router = require("express").Router();
const controller = require("../controllers/uploadController");
const { imageUpload, imagesUpload, videoUpload, mixedUpload } = require("../middleware/uploadMiddleware");
const requireAuth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

router.use((req, res, next) => {
  console.info("[VastraAura upload] route hit", {
    method: req.method,
    path: req.originalUrl,
    contentType: req.headers["content-type"],
    hasCookie: Boolean(req.cookies?.vastraaura_token),
  });
  next();
});

router.post("/image", requireAuth, adminAuth, imageUpload.single("image"), controller.uploadSingleImage);
router.post("/images", requireAuth, adminAuth, imagesUpload.array("images"), controller.uploadMultipleImages);
router.post("/video", requireAuth, adminAuth, videoUpload.single("video"), controller.uploadSingleVideo);
router.post("/mixed", requireAuth, adminAuth, mixedUpload.any(), controller.uploadMixedMedia);

module.exports = router;
