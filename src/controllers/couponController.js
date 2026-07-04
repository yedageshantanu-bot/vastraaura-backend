const mongoose = require("mongoose");
const Coupon = require("../../models/Coupon");
const store = require("../data/store");

const isDbConnected = () => mongoose.connection.readyState === 1;

const normalizeCode = (code) => String(code || "").trim().toUpperCase();

const normalizeProductIds = (value = []) =>
  (Array.isArray(value) ? value : [])
    .map((item) => String(item?._id || item || "").split(":")[0])
    .filter(Boolean);

const toCouponPayload = (body = {}) => ({
  code: normalizeCode(body.code),
  type: body.type === "fixed" ? "fixed" : "percentage",
  discount: Number(body.discount || 0),
  maxDiscount:
    body.maxDiscount === "" || body.maxDiscount === undefined || body.maxDiscount === null
      ? null
      : Number(body.maxDiscount),
  maxUses:
    body.maxUses === "" || body.maxUses === undefined || body.maxUses === null
      ? null
      : Number(body.maxUses),
  expiryDate: body.expiryDate || null,
  isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
  minimumOrder: Number(body.minimumOrder || 0),
  applicableProducts: normalizeProductIds(body.applicableProducts),
  oneUsePerUser: body.oneUsePerUser !== undefined ? Boolean(body.oneUsePerUser) : true,
});

const toCouponPatch = (body = {}) => {
  const patch = {};

  if (body.code !== undefined) patch.code = normalizeCode(body.code);
  if (body.type !== undefined) patch.type = body.type === "fixed" ? "fixed" : "percentage";
  if (body.discount !== undefined) patch.discount = Number(body.discount || 0);
  if (body.maxDiscount !== undefined) {
    patch.maxDiscount =
      body.maxDiscount === "" || body.maxDiscount === null ? null : Number(body.maxDiscount);
  }
  if (body.maxUses !== undefined) {
    patch.maxUses = body.maxUses === "" || body.maxUses === null ? null : Number(body.maxUses);
  }
  if (body.expiryDate !== undefined) patch.expiryDate = body.expiryDate || null;
  if (body.isActive !== undefined) patch.isActive = Boolean(body.isActive);
  if (body.minimumOrder !== undefined) patch.minimumOrder = Number(body.minimumOrder || 0);
  if (body.applicableProducts !== undefined) {
    patch.applicableProducts = normalizeProductIds(body.applicableProducts);
  }
  if (body.oneUsePerUser !== undefined) patch.oneUsePerUser = Boolean(body.oneUsePerUser);

  return patch;
};

const calculateDiscount = (subtotal, coupon) => {
  const discount =
    coupon.type === "percentage"
      ? Math.round((subtotal * Number(coupon.discount || 0)) / 100)
      : Number(coupon.discount || 0);
  const cappedDiscount =
    Number(coupon.maxDiscount || 0) > 0
      ? Math.min(discount, Number(coupon.maxDiscount || 0))
      : discount;

  return Math.min(cappedDiscount, subtotal);
};

const validateCouponRules = ({ coupon, subtotal, productIds, userId }) => {
  if (!coupon) {
    return "Invalid coupon";
  }

  if (!coupon.isActive) {
    return "Coupon is paused";
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    return "Coupon expired";
  }

  if (coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    return "Usage limit exceeded";
  }

  if (subtotal < Number(coupon.minimumOrder || 0)) {
    return "Minimum order not met";
  }

  const applicableProducts = normalizeProductIds(coupon.applicableProducts);
  if (
    applicableProducts.length > 0 &&
    !productIds.some((productId) => applicableProducts.includes(productId))
  ) {
    return "Coupon is not valid for these products";
  }

  const usedBy = (coupon.usedBy || []).map(String);
  if (coupon.oneUsePerUser && userId && usedBy.includes(String(userId))) {
    return "Already used";
  }

  return "";
};

exports.getCoupons = async (req, res) => {
  if (!isDbConnected()) {
    return res.json(store.coupons);
  }

  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  return res.json(coupons);
};

exports.createCoupon = async (req, res) => {
  const payload = toCouponPayload(req.body);

  if (!payload.code || !payload.discount) {
    return res.status(400).json({ error: "Coupon code and discount are required" });
  }

  if (!isDbConnected()) {
    const exists = store.coupons.some((coupon) => coupon.code === payload.code);
    if (exists) {
      return res.status(409).json({ error: "Coupon already exists" });
    }

    const coupon = {
      _id: `c${Date.now()}`,
      ...payload,
      usedCount: 0,
      usedBy: [],
    };
    store.coupons.unshift(coupon);
    return res.status(201).json(coupon);
  }

  const exists = await Coupon.findOne({ code: payload.code }).select("_id");
  if (exists) {
    return res.status(409).json({ error: "Coupon already exists" });
  }

  const coupon = await Coupon.create(payload);
  return res.status(201).json(coupon);
};

exports.updateCoupon = async (req, res) => {
  const payload = toCouponPatch(req.body);

  if (!isDbConnected()) {
    const index = store.coupons.findIndex((coupon) => String(coupon._id) === String(req.params.id));
    if (index === -1) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    store.coupons[index] = {
      ...store.coupons[index],
      ...payload,
    };
    return res.json(store.coupons[index]);
  }

  const coupon = await Coupon.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });

  if (!coupon) {
    return res.status(404).json({ error: "Coupon not found" });
  }

  return res.json(coupon);
};

exports.deleteCoupon = async (req, res) => {
  if (!isDbConnected()) {
    const before = store.coupons.length;
    store.coupons = store.coupons.filter((coupon) => String(coupon._id) !== String(req.params.id));

    if (store.coupons.length === before) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    return res.json({ success: true });
  }

  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    return res.status(404).json({ error: "Coupon not found" });
  }

  return res.json({ success: true });
};

exports.validateCoupon = async (req, res) => {
  const { code, items = [] } = req.body;
  const normalizedCode = normalizeCode(code);
  const productIds = normalizeProductIds(items);
  const subtotal = (Array.isArray(items) ? items : []).reduce(
    (sum, item) => sum + Number(item.discountPrice || item.price || 0) * Math.max(1, Number(item.quantity || 1)),
    0,
  );
  const userId = req.userId || req.auth?._id || req.body.userId || "";

  const coupon = isDbConnected()
    ? await Coupon.findOne({ code: normalizedCode })
    : store.coupons.find((item) => item.code === normalizedCode);

  const message = validateCouponRules({ coupon, subtotal, productIds, userId });
  if (message) {
    return res.status(message === "Invalid coupon" ? 404 : 400).json({ valid: false, message });
  }

  const discount = calculateDiscount(subtotal, coupon);
  return res.json({
    valid: true,
    message: `Coupon applied. You saved ${discount}.`,
    coupon,
    discount,
    amount: discount,
    subtotal,
    total: Math.max(subtotal - discount, 0),
  });
};
