const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const controller = require("../controllers/userController");
const requireAuth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

// 5 attempts per minute per IP for authentication
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: "Too many authentication attempts. Please try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3 attempts per hour for password resets
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: "Too many password reset requests. Please try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, controller.registerWithEmail);
router.post("/login", authLimiter, controller.loginWithEmail);
router.post("/forgot-password", passwordResetLimiter, controller.forgotPassword);
router.post("/reset-password", passwordResetLimiter, controller.resetPassword);
router.post("/auth/firebase", authLimiter, controller.authenticateFirebaseUser);
router.post("/logout", controller.logout);
router.get("/", requireAuth, adminAuth, controller.getUsers);
router.get("/me", requireAuth, controller.getMe);
router.get("/profile", requireAuth, controller.getProfile);
router.patch("/me", requireAuth, controller.updateProfile);
router.delete("/me", requireAuth, controller.deleteAccount);
router.get("/wishlist", requireAuth, controller.getWishlist);
router.post("/wishlist", requireAuth, controller.toggleWishlist);
router.get("/addresses", requireAuth, controller.getAddresses);
router.post("/addresses", requireAuth, controller.saveAddress);
router.put("/addresses/:addressId", requireAuth, controller.updateAddress);
router.delete("/addresses/:addressId", requireAuth, controller.deleteAddress);
router.get("/google", controller.ensureGoogleAuthConfigured, controller.startGoogleAuth);
router.get("/google/callback", controller.handleGoogleCallback);

module.exports = router;
