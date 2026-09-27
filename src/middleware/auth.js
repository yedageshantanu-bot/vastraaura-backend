const jwt = require("jsonwebtoken");
const {
  AUTH_AUDIENCE,
  AUTH_ISSUER,
  JWT_COOKIE_NAME,
  getJwtSecret,
  isTokenBlacklisted,
  normalizeEmail,
  resolveRole,
} = require("../utils/auth");
const { verifyFirebaseIdToken } = require("../utils/firebaseVerifier");
const User = require("../../models/User");

const getToken = (req) => {
  const headerToken = req.headers.authorization?.replace("Bearer ", "");
  const cookieToken = req.cookies?.[JWT_COOKIE_NAME];

  return headerToken || cookieToken || "";
};

const resolveUserSession = async (token) => {
  // 1. Try standard backend JWT verification
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      audience: AUTH_AUDIENCE,
      issuer: AUTH_ISSUER,
    });
    return {
      auth: decoded,
      userId: decoded.sub,
    };
  } catch (jwtErr) {
    // 2. Fallback to Firebase Google ID token verification
    try {
      const decodedFb = await verifyFirebaseIdToken(token, "vastraaura-prod");
      if (decodedFb && decodedFb.email) {
        const email = normalizeEmail(decodedFb.email);
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name: decodedFb.name || "Google User",
            email,
            avatar: decodedFb.picture || "",
            authProvider: "google",
            provider: "google",
            role: resolveRole(email),
          });
        }
        return {
          auth: {
            sub: String(user._id),
            email: user.email,
            role: resolveRole(user.email),
          },
          userId: String(user._id),
        };
      }
    } catch (fbErr) {
      // Token is neither valid backend JWT nor valid Firebase token
    }
    throw jwtErr;
  }
};

const requireAuth = async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (isTokenBlacklisted(token)) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  try {
    const session = await resolveUserSession(token);
    req.auth = session.auth;
    req.userId = session.userId;
    return next();
  } catch (error) {
    console.warn("[VastraAura auth] verification failed", {
      path: req.originalUrl,
      message: error.message,
    });
    return res.status(401).json({ error: "Invalid or expired session" });
  }
};

const optionalAuth = async (req, res, next) => {
  const token = getToken(req);
  if (!token || isTokenBlacklisted(token)) {
    return next();
  }
  try {
    const session = await resolveUserSession(token);
    req.auth = session.auth;
    req.userId = session.userId;
  } catch (error) {
    // Ignore invalid optional tokens
  }
  return next();
};

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.optionalAuth = optionalAuth;
module.exports.getToken = getToken;
