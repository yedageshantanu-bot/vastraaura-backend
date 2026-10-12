const express = require("express");
const controller = require("../src/controllers/orderController");

const router = express.Router();

// Dedicated public gift-unboxing route using long unguessable safeToken
router.get("/:token", controller.getGiftByToken);

module.exports = router;
