const passport = require("../config/passport");
const { isPassportConfigured, passportConfigError } = require("../config/passport");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../../models/User");
const Order = require("../../models/Order");
const Product = require("../../models/Product");
const asyncHandler = require("../../middleware/asyncHandler");
const requireAuth = require("../middleware/auth");
const {
  clearAuthCookie,
  getPopupHtml,
  normalizeEmail,
  sanitizeInternalPath,
  resolveRole,
  sendAuthCookie,
  serializeUser,
  signGoogleAuthState,
  verifyGoogleAuthState,
} = require("../utils/auth");
const {
  createEmailUser,
  findUserByEmail,
  findUserById,
  getOrdersForUser,
  getProductById,
  getWishlistProducts,
  isDbConnected,
} = require("../utils/localStore");

const PASSWORD_MIN_LENGTH = 8;

const ensureAddresses = (user) => (Array.isArray(user.addresses) ? user.addresses : []);

const toSha256 = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

const applyRoleGuard = async (user) => {
  const expectedRole = resolveRole(user.email);
  if (user.role !== expectedRole) {
    user.role = expectedRole;
    await user.save();
  }
  return user;
};

const populateWishlist = async (user) => {
  const populated = await user.populate("wishlist");
  return serializeUser({
    ...populated.toObject(),
    wishlist: populated.wishlist,
  });
};

exports.startGoogleAuth = (req, res, next) => {
  const state = signGoogleAuthState({
    nextPath: sanitizeInternalPath(
      typeof req.query.next === "string" ? req.query.next : "/checkout",
      "/checkout",
    ),
    popup: req.query.popup !== "false",
  });

  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account",
    state,
  })(req, res, next);
};

exports.handleGoogleCallback = [
  (req, res, next) => {
    try {
      req.oauthState = verifyGoogleAuthState(req.query.state);
      return next();
    } catch {
      const homeUrl = new URL(process.env.CLIENT_URL || "http://localhost:3000");
      homeUrl.searchParams.set("error", "signin");
      return res.redirect(homeUrl.toString());
    }
  },
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:3000"}?error=signin`,
  }),
  asyncHandler(async (req, res) => {
    const user = req.user;
    const token = sendAuthCookie(res, user);

    const oauthState = req.oauthState || {};

    const nextPath =
      sanitizeInternalPath(
        typeof oauthState.nextPath === "string"
          ? oauthState.nextPath
          : typeof req.query.next === "string"
            ? req.query.next
            : "/checkout",
        "/checkout",
      );
    const wantsJson = oauthState.popup === false || req.query.popup === "false";

    if (wantsJson) {
      return res.json({ success: true, user: serializeUser(user), token, nextPath });
    }

    res.send(
      getPopupHtml({
        success: true,
        message: "Signed in successfully",
        token,
        nextPath,
      }),
    );
  }),
];

exports.ensureGoogleAuthConfigured = (req, res, next) => {
  if (!isPassportConfigured) {
    return res.status(500).json({
      error: "Sign-in is temporarily unavailable",
    });
  }

  return next();
};

exports.getMe = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    const user = findUserById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    sendAuthCookie(res, user);
    return res.json({ success: true, user: serializeUser(user) });
  }

  const user = await User.findById(req.userId).populate("wishlist");

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  await applyRoleGuard(user);
  sendAuthCookie(res, user);

  return res.json({ success: true, user: serializeUser(user) });
});

exports.registerWithEmail = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` });
  }

  if (!isDbConnected()) {
    const existing = findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const user = await createEmailUser({ name, email, password });
    const token = sendAuthCookie(res, user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: serializeUser(user),
      token,
    });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    authProvider: "local",
    provider: "local",
    role: resolveRole(email),
  });

  const token = sendAuthCookie(res, user);

  return res.status(201).json({
    success: true,
    message: "Account created successfully",
    user: serializeUser(user),
    token,
  });
});

exports.loginWithEmail = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (!isDbConnected()) {
    const user = findUserByEmail(email);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = sendAuthCookie(res, user);

    return res.json({
      success: true,
      message: "Signed in successfully",
      user: serializeUser(user),
      token,
    });
  }

  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  user.role = resolveRole(user.email);
  await user.save();

  const token = sendAuthCookie(res, user);

  return res.json({
    success: true,
    message: "Signed in successfully",
    user: serializeUser(user),
    token,
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  if (!isDbConnected()) {
    const user = findUserByEmail(email);

    if (!user) {
      return res.json({
        success: true,
        message: "If this email exists, a reset link has been generated.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordTokenHash = toSha256(rawToken);
    user.resetPasswordExpiresAt = new Date(Date.now() + 1000 * 60 * 20).toISOString();

    return res.json({
      success: true,
      message: "If this email exists, a reset link has been generated.",
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      success: true,
      message: "If this email exists, a reset link has been generated.",
    });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordTokenHash = toSha256(rawToken);
  user.resetPasswordExpiresAt = new Date(Date.now() + 1000 * 60 * 20);
  await user.save();

  return res.json({
    success: true,
    message: "If this email exists, a reset link has been generated.",
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const token = String(req.body.token || "").trim();
  const password = String(req.body.password || "");

  if (!token || !password) {
    return res.status(400).json({ error: "Token and new password are required" });
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` });
  }

  const tokenHash = toSha256(token);

  if (!isDbConnected()) {
    const store = require("../data/store");
    const resetUser = store.users.find((user) => user.resetPasswordTokenHash === tokenHash);

    if (
      !resetUser ||
      !resetUser.resetPasswordExpiresAt ||
      new Date(resetUser.resetPasswordExpiresAt) <= new Date()
    ) {
      return res.status(400).json({ error: "Reset token is invalid or expired" });
    }

    resetUser.passwordHash = await bcrypt.hash(password, 12);
    resetUser.authProvider = resetUser.googleId ? "hybrid" : "local";
    resetUser.provider = resetUser.authProvider;
    resetUser.resetPasswordTokenHash = "";
    resetUser.resetPasswordExpiresAt = null;
    resetUser.role = resolveRole(resetUser.email);
    resetUser.updatedAt = new Date().toISOString();

    sendAuthCookie(res, resetUser);

    return res.json({
      success: true,
      message: "Password reset successfully",
      user: serializeUser(resetUser),
    });
  }

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ error: "Reset token is invalid or expired" });
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.authProvider = user.googleId ? "hybrid" : "local";
  user.provider = user.authProvider;
  user.resetPasswordTokenHash = "";
  user.resetPasswordExpiresAt = null;
  user.role = resolveRole(user.email);
  await user.save();

  sendAuthCookie(res, user);

  return res.json({
    success: true,
    message: "Password reset successfully",
    user: serializeUser(user),
  });
});

exports.logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  return res.json({ success: true, message: "Signed out" });
});

exports.getUsers = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    const store = require("../data/store");
    return res.json({
      success: true,
      count: store.users.length,
      users: store.users.map(serializeUser),
    });
  }

  const users = await User.find().sort({ createdAt: -1 }).lean();
  return res.json({ success: true, count: users.length, users: users.map(serializeUser) });
});

exports.getProfile = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    const user = findUserById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      success: true,
      user: serializeUser(user),
      orders: getOrdersForUser(user._id),
      addresses: ensureAddresses(user),
    });
  }

  const user = await User.findById(req.userId).populate("wishlist");

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  await applyRoleGuard(user);

  const orders = await Order.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .populate("products.productId")
    .lean();

  return res.json({
    success: true,
    user: serializeUser(user),
    orders,
    addresses: ensureAddresses(user),
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    const user = findUserById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, phone, profileImage, avatar } = req.body;
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (avatar !== undefined) user.avatar = avatar;
    user.role = resolveRole(user.email);
    user.updatedAt = new Date().toISOString();

    return res.json({ success: true, user: serializeUser(user) });
  }

  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { name, phone, profileImage, avatar } = req.body;
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (profileImage !== undefined) user.profileImage = profileImage;
  if (avatar !== undefined) user.avatar = avatar;
  user.role = resolveRole(user.email);

  await user.save();
  return res.json({ success: true, user: serializeUser(user) });
});

exports.getWishlist = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    const user = findUserById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ success: true, wishlist: getWishlistProducts(user) });
  }

  const user = await User.findById(req.userId).populate("wishlist");

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ success: true, wishlist: user.wishlist || [] });
});

exports.toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: "productId is required" });
  }

  if (!isDbConnected()) {
    const user = findUserById(req.userId);
    const product = getProductById(productId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const existing = user.wishlist.map(String);
    const alreadySaved = existing.includes(String(productId));
    user.wishlist = alreadySaved
      ? user.wishlist.filter((item) => String(item) !== String(productId))
      : [...user.wishlist, product._id];
    user.updatedAt = new Date().toISOString();

    return res.json({
      success: true,
      wishlist: getWishlistProducts(user),
      user: serializeUser(user),
    });
  }

  const [user, product] = await Promise.all([
    User.findById(req.userId),
    Product.findById(productId).lean(),
  ]);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  const existing = user.wishlist.map((item) => String(item));
  const alreadySaved = existing.includes(String(productId));
  user.wishlist = alreadySaved
    ? user.wishlist.filter((item) => String(item) !== String(productId))
    : [...user.wishlist, product._id];

  await user.save();
  await user.populate("wishlist");

  return res.json({
    success: true,
    wishlist: user.wishlist,
    user: serializeUser(user),
  });
});

exports.getAddresses = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    const user = findUserById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ success: true, addresses: user.addresses || [] });
  }

  const user = await User.findById(req.userId).lean();

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ success: true, addresses: user.addresses || [] });
});

exports.saveAddress = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    const user = findUserById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const address = req.body;
    const normalized = {
      _id: `a${Date.now()}`,
      label: address.label || `Address ${user.addresses.length + 1}`,
      fullName: address.fullName || user.name,
      phone: address.phone || user.phone || "",
      address: address.address || "",
      landmark: address.landmark || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      isDefault: Boolean(address.isDefault),
    };

    if (normalized.isDefault) {
      user.addresses = user.addresses.map((item) => ({ ...item, isDefault: false }));
    }

    user.addresses.push(normalized);
    user.updatedAt = new Date().toISOString();
    return res.status(201).json({ success: true, addresses: user.addresses });
  }

  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const address = req.body;
  const label = address.label || `Address ${user.addresses.length + 1}`;
  const normalized = {
    label,
    fullName: address.fullName || user.name,
    phone: address.phone || user.phone || "",
    address: address.address || "",
    landmark: address.landmark || "",
    city: address.city || "",
    state: address.state || "",
    pincode: address.pincode || "",
    isDefault: Boolean(address.isDefault),
  };

  if (normalized.isDefault) {
    user.addresses = user.addresses.map((item) => ({ ...item.toObject?.() ?? item, isDefault: false }));
  }

  user.addresses.push(normalized);
  await user.save();

  return res.status(201).json({ success: true, addresses: user.addresses });
});

exports.updateAddress = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    const user = findUserById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const address = user.addresses.find((item) => String(item._id) === String(req.params.addressId));
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    Object.assign(address, req.body);

    if (req.body.isDefault) {
      user.addresses.forEach((item) => {
        if (String(item._id) !== String(address._id)) {
          item.isDefault = false;
        }
      });
    }

    user.updatedAt = new Date().toISOString();
    return res.json({ success: true, addresses: user.addresses });
  }

  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    return res.status(404).json({ error: "Address not found" });
  }

  Object.assign(address, req.body);

  if (req.body.isDefault) {
    user.addresses.forEach((item) => {
      if (String(item._id) !== String(address._id)) {
        item.isDefault = false;
      }
    });
  }

  await user.save();
  return res.json({ success: true, addresses: user.addresses });
});

exports.deleteAddress = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    const user = findUserById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.addresses = user.addresses.filter((item) => String(item._id) !== String(req.params.addressId));
    user.updatedAt = new Date().toISOString();

    return res.json({ success: true, addresses: user.addresses });
  }

  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.addresses = user.addresses.filter((item) => String(item._id) !== String(req.params.addressId));
  await user.save();

  return res.json({ success: true, addresses: user.addresses });
});

const { verifyFirebaseIdToken } = require("../utils/firebaseVerifier");

exports.authenticateFirebaseUser = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await verifyFirebaseIdToken(idToken, "vastraaura-prod");
    const { name, email, picture } = decodedToken;

    let user;

    if (!isDbConnected()) {
      user = findUserByEmail(email);
      if (!user) {
        user = await createEmailUser({
          name: name || "Google User",
          email,
          password: "firebase_sso_oauth_user_password_bypass",
        });
      }
    } else {
      user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: name || "Google User",
          email,
          avatar: picture || "",
          authProvider: "google",
          provider: "google",
          role: resolveRole(email),
        });
      } else {
        let needsSave = false;
        const expectedRole = resolveRole(email);
        if (user.role !== expectedRole) {
          user.role = expectedRole;
          needsSave = true;
        }
        if (!user.avatar && picture) {
          user.avatar = picture;
          needsSave = true;
        }
        if (needsSave) {
          await user.save();
        }
      }
    }

    const token = sendAuthCookie(res, user);

    return res.json({
      success: true,
      message: "Authenticated successfully",
      user: serializeUser(user),
      token,
    });
  } catch (error) {
    console.error("[VastraAura Backend] Firebase authentication failed:", error);
    return res.status(401).json({ error: `Invalid Firebase authentication token: ${error.message}` });
  }
});

exports.requireAuth = requireAuth;
