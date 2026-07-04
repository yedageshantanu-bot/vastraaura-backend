const router = require("express").Router();
const controller = require("../controllers/couponController");
const requireAuth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

router.get("/", controller.getCoupons);
router.post("/", requireAuth, adminAuth, controller.createCoupon);
router.post("/validate", controller.validateCoupon);
router.put("/:id", requireAuth, adminAuth, controller.updateCoupon);
router.delete("/:id", requireAuth, adminAuth, controller.deleteCoupon);

module.exports = router;
