const router = require("express").Router();
const controller = require("../controllers/userController");
const requireAuth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

router.post("/register", controller.registerWithEmail);
router.post("/login", controller.loginWithEmail);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);
router.post("/logout", controller.logout);
router.get("/", requireAuth, adminAuth, controller.getUsers);
router.get("/me", requireAuth, controller.getMe);
router.get("/profile", requireAuth, controller.getProfile);
router.patch("/me", requireAuth, controller.updateProfile);
router.get("/wishlist", requireAuth, controller.getWishlist);
router.post("/wishlist", requireAuth, controller.toggleWishlist);
router.get("/addresses", requireAuth, controller.getAddresses);
router.post("/addresses", requireAuth, controller.saveAddress);
router.put("/addresses/:addressId", requireAuth, controller.updateAddress);
router.delete("/addresses/:addressId", requireAuth, controller.deleteAddress);
router.get("/google", controller.ensureGoogleAuthConfigured, controller.startGoogleAuth);
router.get("/google/callback", controller.handleGoogleCallback);

module.exports = router;
