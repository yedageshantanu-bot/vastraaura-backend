/**
 * Sanitizes request inputs against NoSQL injection and XSS payloads.
 */

// Strips keys starting with '$' or containing '.' to prevent NoSQL operator injection
const sanitizeNoSql = (target) => {
  if (target === null || typeof target !== "object") {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map(sanitizeNoSql);
  }

  const sanitized = {};
  for (const key of Object.keys(target)) {
    // Block key if it starts with $ (Mongo query operator like $gt, $ne, $where)
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    sanitized[key] = sanitizeNoSql(target[key]);
  }

  return sanitized;
};

// Strips script tags and dangerous HTML tags from string inputs to prevent Stored XSS
const sanitizeXssString = (str) => {
  if (typeof str !== "string") return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
};

const sanitizeXss = (target) => {
  if (typeof target === "string") {
    return sanitizeXssString(target);
  }

  if (target === null || typeof target !== "object") {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map(sanitizeXss);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(target)) {
    sanitized[key] = sanitizeXss(value);
  }

  return sanitized;
};

const mongoSanitizeMiddleware = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeNoSql(req.body);
  }
  if (req.query) {
    req.query = sanitizeNoSql(req.query);
  }
  if (req.params) {
    req.params = sanitizeNoSql(req.params);
  }
  next();
};

const xssSanitizeMiddleware = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeXss(req.body);
  }
  if (req.query) {
    req.query = sanitizeXss(req.query);
  }
  if (req.params) {
    req.params = sanitizeXss(req.params);
  }
  next();
};

module.exports = {
  mongoSanitizeMiddleware,
  xssSanitizeMiddleware,
  sanitizeNoSql,
  sanitizeXss,
};
