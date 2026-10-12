const router = require("express").Router();
const controller = require("../controllers/adminController");
const userController = require("../controllers/userController");
const adminAuth = require("../middleware/adminAuth");
const requireAuth = require("../middleware/auth");

router.get("/stats", requireAuth, adminAuth, controller.getStats);
router.get("/users", requireAuth, adminAuth, userController.getUsers);

module.exports = router;
