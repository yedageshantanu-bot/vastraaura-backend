module.exports = (error, req, res, next) => {
  const status = error.status || error.statusCode || (error.code === "LIMIT_FILE_SIZE" ? 413 : 500);
  const message =
    error.code === "LIMIT_FILE_SIZE"
      ? "File is too large for this upload field"
      : error.message || "Internal server error";

  console.error("[VastraAura API error]", {
    path: req.originalUrl,
    method: req.method,
    status,
    code: error.code,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });

  res.status(status).json({
    success: false,
    message,
    error: message,
  });
};
