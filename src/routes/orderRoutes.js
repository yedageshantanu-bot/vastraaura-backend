const router = require("express").Router();
const controller = require("../controllers/orderController");
const requireAuth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

router.get("/", requireAuth, adminAuth, controller.getOrders);
router.get("/me", requireAuth, controller.getMyOrders);
router.post("/razorpay/create", requireAuth, controller.createRazorpayOrder);
router.post("/razorpay/verify", requireAuth, controller.verifyRazorpayPayment);
router.get("/:id", requireAuth, controller.getOrder);
router.patch("/:id/status", requireAuth, adminAuth, controller.updateDeliveryStatus);

module.exports = router;
