const router = require("express").Router();
const controller = require("../controllers/productController");
const { productMediaUpload } = require("../middleware/uploadMiddleware");
const requireAuth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

router.get("/", controller.getProducts);
router.post("/", requireAuth, adminAuth, productMediaUpload.any(), controller.createProduct);
router.put("/:id", requireAuth, adminAuth, productMediaUpload.any(), controller.updateProduct);
router.delete("/:id/media", requireAuth, adminAuth, controller.deleteProductMedia);
router.put("/:id/reorder-media", requireAuth, adminAuth, controller.reorderMedia);
router.put("/:id/thumbnail", requireAuth, adminAuth, controller.setThumbnailImage);
router.patch("/:id/featured", requireAuth, adminAuth, controller.toggleFeaturedProduct);
router.patch("/:id/active", requireAuth, adminAuth, controller.toggleActiveProduct);
router.get("/:id", controller.getProduct);
router.post("/:id/reviews", requireAuth, controller.addProductReview);
router.delete("/:id", requireAuth, adminAuth, controller.deleteProduct);

module.exports = router;