const { onRequest } = require("firebase-functions/v2/https");
const { app } = require("./server");
const connectDB = require("./config/db");

// Establish database connection on Cloud Function cold start
connectDB().then(() => {
  console.log("[VastraAura Cloud Function] MongoDB connected.");
}).catch((err) => {
  console.error("[VastraAura Cloud Function] MongoDB connection failed:", err.message);
});

// Export Express app under the 'api' endpoint
exports.api = onRequest({ cors: true, maxInstances: 10 }, app);
