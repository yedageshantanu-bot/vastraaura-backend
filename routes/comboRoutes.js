const express = require("express");
const router = express.Router();
const {
  getCombos,
  createCombo,
  updateCombo,
  deleteCombo,
} = require("../controllers/comboController");

const requireAuth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

router.route("/").get(getCombos).post(requireAuth, adminAuth, createCombo);

router
  .route("/:id")
  .put(requireAuth, adminAuth, updateCombo)
  .delete(requireAuth, adminAuth, deleteCombo);

module.exports = router;
