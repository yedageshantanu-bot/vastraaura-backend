const router = require("express").Router();
const controller = require("../controllers/couponController");
const requireAuth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

const rateLimit = require("express-rate-limit");

const couponValidateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { valid: false, message: "Too many coupon attempts. Please try again in a minute." },
});

// Admin-only coupon management
router.get("/", requireAuth, adminAuth, controller.getCoupons);
router.post("/", requireAuth, adminAuth, controller.createCoupon);
router.put("/:id", requireAuth, adminAuth, controller.updateCoupon);
router.delete("/:id", requireAuth, adminAuth, controller.deleteCoupon);

// Customer-facing validation for specific entered coupon code
router.post("/validate", couponValidateLimiter, controller.validateCoupon);

module.exports = router;
