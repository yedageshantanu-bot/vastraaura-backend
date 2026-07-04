const jwt = require("jsonwebtoken");
const { AUTH_AUDIENCE, AUTH_ISSUER, JWT_COOKIE_NAME, getJwtSecret } = require("../utils/auth");

const getToken = (req) => {
  const headerToken = req.headers.authorization?.replace("Bearer ", "");
  const cookieToken = req.cookies?.[JWT_COOKIE_NAME];

  return headerToken || cookieToken || "";
};

const requireAuth = (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      audience: AUTH_AUDIENCE,
      issuer: AUTH_ISSUER,
    });
    req.auth = decoded;
    req.userId = decoded.sub;
    return next();
  } catch (error) {
    console.warn("[VastraAura auth] JWT verification failed", {
      path: req.originalUrl,
      message: error.message,
    });
    return res.status(401).json({ error: "Invalid or expired session" });
  }
};

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.getToken = getToken;
