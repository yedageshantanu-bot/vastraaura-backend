const User = require("../../models/User");
const { ADMIN_EMAIL, normalizeEmail, resolveRole } = require("../utils/auth");
const { findUserById, isDbConnected } = require("../utils/localStore");

module.exports = async (req, res, next) => {
  if (!isDbConnected()) {
    const user = findUserById(req.userId);

    if (!user || normalizeEmail(user.email) !== ADMIN_EMAIL) {
      console.warn("[VastraAura admin] denied local admin API access", {
        email: normalizeEmail(user?.email),
      });
      return res.status(403).json({ error: "Admin access required" });
    }

    req.auth.role = "admin";
    console.info("[VastraAura admin] local admin API access granted", {
      email: normalizeEmail(user.email),
    });
    return next();
  }

  const user = await User.findById(req.userId).select("email role");

  if (!user || normalizeEmail(user.email) !== ADMIN_EMAIL) {
    console.warn("[VastraAura admin] denied admin API access", {
      email: normalizeEmail(user?.email),
    });
    return res.status(403).json({ error: "Admin access required" });
  }

  const role = resolveRole(user.email);
  if (user.role !== role) {
    user.role = role;
    await user.save();
  }

  req.auth.role = "admin";
  console.info("[VastraAura admin] admin API access granted", {
    email: normalizeEmail(user.email),
  });
  return next();
};
