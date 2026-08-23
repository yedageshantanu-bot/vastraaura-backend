const router = require("express").Router();
const controller = require("../controllers/enquiryController");
const requireAuth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

// User routes
router.post("/", requireAuth, controller.createEnquiry);

// Admin routes
router.get("/", requireAuth, adminAuth, controller.getEnquiries);
router.patch("/:id/status", requireAuth, adminAuth, controller.updateEnquiryStatus);
router.delete("/:id", requireAuth, adminAuth, controller.deleteEnquiry);

module.exports = router;
