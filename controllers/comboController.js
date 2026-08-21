const Combo = require("../models/Combo");
const asyncHandler = require("../middleware/asyncHandler");

// @desc    Get all combos
// @route   GET /api/combos
// @access  Public
exports.getCombos = asyncHandler(async (req, res) => {
  const combos = await Combo.find({}).sort({ displayOrder: 1, createdAt: -1 });
  
  // Format the output to match what the frontend expects
  const formattedCombos = combos.map(c => ({
    id: c._id,
    _id: c._id,
    name: c.name,
    image: c.image,
    galleryImages: c.galleryImages,
    videos: c.videos,
    ribbon: c.ribbon,
    savings_pct: c.savings_pct,
    tagline: c.tagline,
    included: c.included,
    original_price: c.original_price,
    price: c.price,
    isActive: c.isActive,
    displayOrder: c.displayOrder
  }));
  
  res.status(200).json(formattedCombos);
});

// @desc    Create a combo
// @route   POST /api/combos
// @access  Private/Admin
exports.createCombo = asyncHandler(async (req, res) => {
  const combo = await Combo.create(req.body);
  res.status(201).json(combo);
});

// @desc    Update a combo
// @route   PUT /api/combos/:id
// @access  Private/Admin
exports.updateCombo = asyncHandler(async (req, res) => {
  const combo = await Combo.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!combo) {
    return res.status(404).json({ error: "Combo not found" });
  }

  res.status(200).json(combo);
});

// @desc    Delete a combo
// @route   DELETE /api/combos/:id
// @access  Private/Admin
exports.deleteCombo = asyncHandler(async (req, res) => {
  const combo = await Combo.findByIdAndDelete(req.params.id);

  if (!combo) {
    return res.status(404).json({ error: "Combo not found" });
  }

  res.status(200).json({ success: true, message: "Combo removed" });
});
