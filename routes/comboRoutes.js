const express = require("express");
const router = express.Router();
const {
  getCombos,
  createCombo,
  updateCombo,
  deleteCombo,
} = require("../controllers/comboController");

const { protect, authorize } = require("../middleware/auth");

router.route("/").get(getCombos).post(protect, authorize("admin"), createCombo);

router
  .route("/:id")
  .put(protect, authorize("admin"), updateCombo)
  .delete(protect, authorize("admin"), deleteCombo);

module.exports = router;
