const User = require("../../models/User");
const { ADMIN_EMAIL, normalizeEmail, resolveRole } = require("../utils/auth");
const { findUserById, isDbConnected } = require("../utils/localStore");

const isAdminUser = (user) => {
  if (!user) return false;
  const email = normalizeEmail(user.email);
  const allowlist = (process.env.ADMIN_GMAIL_ALLOWLIST || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const hardcodedAdmins = ["yedageshantanu70@gmail.com", "pawartanu417@gmail.com"];
  return email === ADMIN_EMAIL || allowlist.includes(email) || hardcodedAdmins.includes(email);
};

module.exports = async (req, res, next) => {
  if (!isDbConnected()) {
    const user = findUserById(req.userId);

    if (!user || !isAdminUser(user)) {
      console.warn("[VastraAura admin] denied local admin API access", {
        userId: user?._id || "unknown",
      });
      return res.status(403).json({ error: "Admin access required" });
    }

    req.auth.role = "admin";
    console.info("[VastraAura admin] local admin API access granted", {
      userId: user._id,
    });
    return next();
  }

  const user = await User.findById(req.userId).select("email role");

  if (!user || !isAdminUser(user)) {
    console.warn("[VastraAura admin] denied admin API access", {
      userId: user?._id || "unknown",
    });
    return res.status(403).json({ error: "Admin access required" });
  }

  const role = resolveRole(user.email);
  if (user.role !== role) {
    try {
      await User.updateOne({ _id: user._id }, { $set: { role: role } });
      user.role = role;
    } catch (err) {
      console.error("[VastraAura admin] Failed to upgrade user role:", err);
    }
  }

  req.auth.role = "admin";
  console.info("[VastraAura admin] admin API access granted", {
    userId: user._id,
  });
  return next();
};
