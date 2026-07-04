const router = require("express").Router();
const userController = require("../controllers/userController");
const requireAuth = require("../middleware/auth");

router.get("/me", requireAuth, userController.getMe);

module.exports = router;
