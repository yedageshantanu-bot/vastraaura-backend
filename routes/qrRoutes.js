const express = require("express");
const requireAuth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const controller = require("../controllers/qrCodeController");

const router = express.Router();

// Public scan target — no auth, but view counting is safe.
router.post("/:id/view", controller.recordView);

// QR management is an administrative capability.
router.use(requireAuth, adminAuth);

router.get("/", controller.getQrCodes);
router.post("/", controller.createQrCode);
router.get("/:id", controller.getQrCode);
router.put("/:id", controller.updateQrCode);
router.delete("/:id", controller.deleteQrCode);

module.exports = router;
