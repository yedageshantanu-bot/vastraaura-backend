const jwt = require("jsonwebtoken");

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "yedageshantanu@gmail.com").trim().toLowerCase();
const JWT_COOKIE_NAME = "vastraaura_token";
const AUTH_ISSUER = "alaira-api";
const AUTH_AUDIENCE = "alaira-web";
const GOOGLE_STATE_AUDIENCE = "alaira-google-state";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing from the environment");
  }
  return secret;
};
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const resolveRole = (email) => (normalizeEmail(email) === ADMIN_EMAIL ? "admin" : "customer");

const buildCookieOptions = () => ({
  httpOnly: true,
  secure:
    process.env.NODE_ENV === "production" ||
    process.env.CLIENT_URL?.startsWith("https://") ||
    process.env.CLIENT_URL?.includes("localhost"),
  sameSite: "none",
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 30,
});

const signAuthToken = (user) =>
  jwt.sign(
    {
      sub: String(user._id),
      email: normalizeEmail(user.email),
      role: resolveRole(user.email),
    },
    getJwtSecret(),
    {
      audience: AUTH_AUDIENCE,
      expiresIn: "30d",
      issuer: AUTH_ISSUER,
    },
  );

const signGoogleAuthState = ({ nextPath = "/checkout", popup = true }) =>
  jwt.sign(
    {
      nextPath: sanitizeInternalPath(nextPath, "/checkout"),
      popup: Boolean(popup),
    },
    getJwtSecret(),
    {
      audience: GOOGLE_STATE_AUDIENCE,
      expiresIn: "10m",
      issuer: AUTH_ISSUER,
    },
  );

const verifyGoogleAuthState = (value) =>
  jwt.verify(String(value || ""), getJwtSecret(), {
    audience: GOOGLE_STATE_AUDIENCE,
    issuer: AUTH_ISSUER,
  });

const serializeUser = (user) => ({
  _id: String(user._id),
  name: user.name,
  email: normalizeEmail(user.email),
  profileImage: user.profileImage || user.avatar || "",
  avatar: user.profileImage || user.avatar || "",
  role: resolveRole(user.email),
  phone: user.phone || "",
  addresses: user.addresses || [],
  wishlist: user.wishlist || [],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const sendAuthCookie = (res, user) => {
  const safeUser = {
    _id: user._id,
    email: user.email,
    role: resolveRole(user.email),
  };
  const token = signAuthToken(safeUser);
  res.cookie(JWT_COOKIE_NAME, token, buildCookieOptions());
  return token;
};

const clearAuthCookie = (res) => {
  res.clearCookie(JWT_COOKIE_NAME, {
    path: "/",
    sameSite: "none",
    secure:
      process.env.NODE_ENV === "production" ||
      process.env.CLIENT_URL?.startsWith("https://") ||
      process.env.CLIENT_URL?.includes("localhost"),
  });
};

const getFrontendUrl = () =>
  process.env.CLIENT_URL || "http://localhost:3000";

const sanitizeInternalPath = (value, fallback = "/") => {
  const safeFallback = String(fallback || "/").startsWith("/") ? String(fallback || "/") : "/";
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return safeFallback;
  }

  if (rawValue.startsWith("//")) {
    return safeFallback;
  }

  try {
    const parsed = new URL(rawValue, "http://localhost");
    if (parsed.origin !== "http://localhost") {
      return safeFallback;
    }

    const internalPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return internalPath.startsWith("/") ? internalPath : safeFallback;
  } catch {
    return safeFallback;
  }
};

const getPopupHtml = ({ success, message, token, nextPath = "/" }) => `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>VastraAura Auth</title></head>
  <body>
    <script>
      (function () {
        var payload = ${JSON.stringify({
          success,
          message,
          token,
          nextPath: sanitizeInternalPath(nextPath, "/"),
        })};
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: "vastraaura:auth", payload: payload }, ${JSON.stringify(getFrontendUrl())});
          }
        } catch (error) {}
        window.close();
      })();
    </script>
    <p>${message}</p>
  </body>
</html>`;

module.exports = {
  ADMIN_EMAIL,
  JWT_COOKIE_NAME,
  buildCookieOptions,
  clearAuthCookie,
  AUTH_AUDIENCE,
  AUTH_ISSUER,
  getFrontendUrl,
  getJwtSecret,
  getPopupHtml,
  normalizeEmail,
  sanitizeInternalPath,
  signGoogleAuthState,
  resolveRole,
  sendAuthCookie,
  serializeUser,
  signAuthToken,
  verifyGoogleAuthState,
};
