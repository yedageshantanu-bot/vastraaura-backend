const router = require("express").Router();
const controller = require("../controllers/orderController");

router.post("/webhook", controller.handleRazorpayWebhook);

module.exports = router;
