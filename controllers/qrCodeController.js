const asyncHandler = require("../middleware/asyncHandler");
const QrCode = require("../models/QrCode");

let qrLib;
try {
  qrLib = require("qrcode");
} catch {
  qrLib = null;
}

const STORE_BASE =
  process.env.CLIENT_URL || "https://alairahouse.com";

const SAFE_KINDS = ["product", "combo", "page", "collection", "custom"];

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

// Build a real, scannable destination from a chosen target — never a dead link.
// Resolved against the store's actual Next.js routes:
//   products   -> /product/{id}     (product detail route is [id])
//   collection -> /collection/{slug}
//   combo      -> /shop             (combos live on the home page, no route of their own)
//   page       -> /{slug}
//   custom     -> whatever the admin typed
const resolveDestination = ({ kind, destination, sourceRef, sourceRefId }) => {
  const explicit = String(destination || "").trim();

  if (explicit) {
    if (/^https?:\/\//i.test(explicit)) {
      return { destination: explicit, kind: kind || "custom" };
    }
    if (explicit.startsWith("/")) {
      return { destination: `${STORE_BASE}${explicit.replace(/^\/+/, "/")}`, kind: kind || "custom" };
    }
    return { destination: `${STORE_BASE}/${explicit}`, kind: kind || "custom" };
  }

  const ref = String(sourceRef || sourceRefId || "").trim();

  if (kind === "product") {
    return { destination: ref ? `${STORE_BASE}/product/${encodeURIComponent(ref)}` : `${STORE_BASE}/shop`, kind: "product" };
  }

  if (kind === "collection") {
    return {
      destination: `${STORE_BASE}/collection/${slugify(ref) || "toys"}`,
      kind: "collection",
    };
  }

  if (kind === "page") {
    return { destination: `${STORE_BASE}/${slugify(ref)}`, kind: "page" };
  }

  // Combos are rendered on the home page — no dedicated route exists.
  return { destination: `${STORE_BASE}/shop`, kind: kind || "custom" };
};

const toDataUrl = async (payload, { size = 300, color = "#0f172a", bgColor = "#ffffff" } = {}) => {
  if (!qrLib) {
    throw new Error("QR code generation is unavailable on the server");
  }
  return qrLib.toDataURL(payload, {
    errorCorrectionLevel: "M",
    width: size,
    margin: 2,
    color: { dark: color, light: bgColor },
  });
};

// @desc    List QR codes
// @route   GET /api/qr
exports.getQrCodes = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.kind) filter.kind = String(req.query.kind);
  if (req.query.q) filter.label = new RegExp(String(req.query.q), "i");

  const codes = await QrCode.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, codes });
});

// @desc    Generate a QR code (optionally persist)
// @route   POST /api/qr
// body: { label, kind, destination?, sourceRef?, sourceRefId?, size?, color?, bgColor?, save? }
exports.createQrCode = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { label, size, color, bgColor, save = true } = body;

  if (!label || !String(label).trim()) {
    return res
      .status(400)
      .json({ success: false, message: "A label is required for the QR code" });
  }

  const kind = SAFE_KINDS.includes(body.kind) ? body.kind : "custom";
  const resolved = resolveDestination({
    kind,
    destination: body.destination,
    sourceRef: body.sourceRef,
    sourceRefId: body.sourceRefId,
  });

  const payload = resolved.destination;
  if (!payload) {
    return res
      .status(400)
      .json({ success: false, message: "Could not resolve a valid QR destination" });
  }

  let image = "";
  try {
    image = await toDataUrl(payload, { size, color, bgColor });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: `QR generation failed: ${error.message}` });
  }

  if (save) {
    const code = await QrCode.create({
      label: String(label).trim(),
      destination: payload,
      payload,
      kind,
      sourceRef: String(body.sourceRef || ""),
      sourceRefId: String(body.sourceRefId || ""),
      image,
      size: Number(size) || 300,
      color: String(color || "#0f172a"),
      bgColor: String(bgColor || "#ffffff"),
      user: req.userId,
    });
    return res.status(201).json({ success: true, code });
  }

  res.status(200).json({
    success: true,
    saved: false,
    payload,
    image,
    kind,
  });
});

// @desc    Get one QR code
// @route   GET /api/qr/:id
exports.getQrCode = asyncHandler(async (req, res) => {
  const code = await QrCode.findById(req.params.id);
  if (!code) {
    return res.status(404).json({ success: false, message: "QR code not found" });
  }
  res.status(200).json({ success: true, code });
});

// @desc    Update label/metadata on a saved QR code
// @route   PUT /api/qr/:id
exports.updateQrCode = asyncHandler(async (req, res) => {
  const allowed = {};
  ["label", "sourceRef", "sourceRefId"].forEach((key) => {
    if (req.body[key] !== undefined) allowed[key] = req.body[key];
  });

  const code = await QrCode.findOneAndUpdate(
    { _id: req.params.id },
    allowed,
    { new: true, runValidators: true }
  );

  if (!code) {
    return res.status(404).json({ success: false, message: "QR code not found" });
  }

  res.status(200).json({ success: true, code });
});

// @desc    Delete a saved QR code
// @route   DELETE /api/qr/:id
exports.deleteQrCode = asyncHandler(async (req, res) => {
  const code = await QrCode.findByIdAndDelete(req.params.id);
  if (!code) {
    return res.status(404).json({ success: false, message: "QR code not found" });
  }
  res.status(200).json({ success: true, message: "QR code deleted" });
});

// @desc    Bump view count (called by the scan target)
// @route   POST /api/qr/:id/view
exports.recordView = asyncHandler(async (req, res) => {
  const code = await QrCode.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewCount: 1 } },
    { new: true }
  ).select("label destination viewCount");

  if (!code) {
    return res.status(404).json({ success: false, message: "QR code not found" });
  }

  res.status(200).json({ success: true, code });
});
