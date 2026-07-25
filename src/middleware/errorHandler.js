const sanitizeString = (str) => {
  if (typeof str !== "string") return str;
  // Replace MongoDB credentials: mongodb+srv://username:password@host -> mongodb+srv://****:****@host
  let sanitized = str.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)(@)/g, "$1****:****$4");
  // Replace Bearer tokens
  sanitized = sanitized.replace(/(Bearer\s+)[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, "$1****");
  // Replace Razorpay live key / secret patterns
  sanitized = sanitized.replace(/(rzp_live_[A-Za-z0-9]{14,32})/g, "rzp_live_****");
  // Replace Google client secret patterns
  sanitized = sanitized.replace(/(GOCSPX-[A-Za-z0-9-_]{24,40})/g, "GOCSPX-****");
  return sanitized;
};

module.exports = (error, req, res, next) => {
  const status = error.status || error.statusCode || (error.code === "LIMIT_FILE_SIZE" ? 413 : 500);
  const message =
    error.code === "LIMIT_FILE_SIZE"
      ? "File is too large for this upload field"
      : error.message || "Internal server error";

  const sanitizedMessage = sanitizeString(message);
  const sanitizedStack = error.stack ? sanitizeString(error.stack) : undefined;

  console.error("[VastraAura API error]", {
    path: req.originalUrl,
    method: req.method,
    status,
    code: error.code,
    message: sanitizedMessage,
    stack: process.env.NODE_ENV === "production" ? undefined : sanitizedStack,
  });

  res.status(status).json({
    success: false,
    message: sanitizedMessage,
    error: sanitizedMessage,
  });
};
