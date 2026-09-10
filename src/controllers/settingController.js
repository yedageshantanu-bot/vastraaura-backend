const Setting = require("../models/Setting");
const asyncHandler = require("../../middleware/asyncHandler");
const { isDbConnected } = require("../utils/localStore");

const DEFAULT_SETTINGS = {
  key: "global_store_settings",
  storeName: "ALAIRA HOUSE",
  supportEmail: "support@alairahouse.com",
  supportPhone: "+91 78419 28485",
  currency: "INR (₹)",
  freeShippingThreshold: 999,
  standardShippingFee: 99,
  whatsappAlerts: true,
  lowStockThreshold: 5,
};

let memSettings = { ...DEFAULT_SETTINGS };

exports.getSettings = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return res.json({ success: true, settings: memSettings });
  }

  let settings = await Setting.findOne({ key: "global_store_settings" }).lean();
  if (!settings) {
    settings = await Setting.create(DEFAULT_SETTINGS);
  }

  return res.json({ success: true, settings });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const allowedKeys = [
    "storeName",
    "supportEmail",
    "supportPhone",
    "freeShippingThreshold",
    "standardShippingFee",
    "whatsappAlerts",
    "lowStockThreshold",
  ];

  const updateData = {};
  for (const key of allowedKeys) {
    if (req.body[key] !== undefined) {
      if (key === "freeShippingThreshold" || key === "standardShippingFee" || key === "lowStockThreshold") {
        updateData[key] = Math.max(0, Number(req.body[key]) || 0);
      } else {
        updateData[key] = req.body[key];
      }
    }
  }

  if (!isDbConnected()) {
    memSettings = { ...memSettings, ...updateData };
    return res.json({ success: true, settings: memSettings });
  }

  const settings = await Setting.findOneAndUpdate(
    { key: "global_store_settings" },
    { $set: updateData },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return res.json({ success: true, settings });
});
