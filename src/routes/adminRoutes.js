const router = require("express").Router();
const controller = require("../controllers/adminController");
const adminAuth = require("../middleware/adminAuth");
const requireAuth = require("../middleware/auth");

router.get("/stats", requireAuth, adminAuth, controller.getStats);

module.exports = router;
