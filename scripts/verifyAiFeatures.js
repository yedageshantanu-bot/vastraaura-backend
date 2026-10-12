const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const app = require("../server").app;

const ROUTES = [
  "GET /api/health",
  "GET /api/ai/notes",
  "POST /api/ai/notes",
  "GET /api/ai/notes/:id",
  "PUT /api/ai/notes/:id",
  "DELETE /api/ai/notes/:id",
  "POST /api/ai/notes/from-url",
  "POST /api/ai/transcribe",
  "GET /api/ai/analysis",
  "POST /api/ai/analysis",
  "POST /api/ai/analysis/transcribe",
  "GET /api/ai/analysis/:id",
  "PUT /api/ai/analysis/:id",
  "DELETE /api/ai/analysis/:id",
  "GET /api/recordings",
  "POST /api/recordings",
  "GET /api/recordings/:id",
  "PUT /api/recordings/:id",
  "DELETE /api/recordings/:id",
  "GET /api/qr",
  "POST /api/qr",
  "GET /api/qr/:id",
  "PUT /api/qr/:id",
  "DELETE /api/qr/:id",
  "POST /api/qr/:id/view",
];

const collected = new Map();
const walk = (stack) => {
  for (const layer of stack) {
    if (layer.route) {
      const methods = layer.route.routes
        ? null
        : Object.keys(layer.route.methods || {}).map((m) => m.toUpperCase());
      for (const m of methods) {
        collected.set(`${m} ${stack.map((s) => s.path).join("")}`, true);
      }
    }
    if (layer.stack) walk([...stack, { path: layer.path || "" }]);
  }
};
walk(app._router ? app._router.stack : app._router ? [] : []);

// app.use mounting flattens differently; fall back to a live request probe.
const http = require("http");
const server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  for (const spec of ROUTES) {
    const [method, path] = spec.split(" ");
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" || method === "PUT" ? "{}" : undefined,
    }).catch((e) => null);
    const status = res ? res.status : "CONN_ERR";
    const ok = status !== "CONN_ERR" && status !== 404;
    console.log(`${ok ? "PASS" : "FAIL"}  ${status}  ${spec}`);
  }

  // QR library functional check
  try {
    const qr = require("qrcode");
    const url = await qr.toDataURL("https://example.com", { width: 128 });
    console.log(
      `QRGEN ${url.startsWith("data:image/png") ? "PASS" : "FAIL"} (${url.length} chars)`
    );
  } catch (e) {
    console.log(`QRGEN FAIL ${e.message}`);
  }

  // Groq configured check (should be empty here — proves graceful path)
  const groq = require("../config/groq");
  console.log(
    `GROQ_CONFIGURED ${groq.isConfigured() ? "true" : "false"} model=${groq.getChatModel()}`
  );

  server.close();
  process.exit(0);
});
