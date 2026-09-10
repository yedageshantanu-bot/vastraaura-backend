const router = require("express").Router();
const controller = require("../controllers/settingController");
const requireAuth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

// Public endpoint to get shipping threshold and store contact settings
router.get("/", controller.getSettings);

// Admin endpoints to update shipping rules and store settings
router.put("/", requireAuth, adminAuth, controller.updateSettings);
router.post("/", requireAuth, adminAuth, controller.updateSettings);

module.exports = router;
