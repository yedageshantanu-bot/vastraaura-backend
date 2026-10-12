const fs = require("fs");
const path = require("path");
const os = require("os");
const asyncHandler = require("../middleware/asyncHandler");
const AiAnalysis = require("../models/AiAnalysis");
const AiNote = require("../models/AiNote");
const MediaRecording = require("../models/MediaRecording");
const Product = require("../models/Product");
const Combo = require("../models/Combo");
const groq = require("../config/groq");

const MAX_INPUT_CHARS = 16000;

const truncate = (text, max = MAX_INPUT_CHARS) => {
  const clean = String(text || "");
  return clean.length > max ? `${clean.slice(0, max)}\n[truncated]` : clean;
};

const extractJson = (content) => {
  const raw = String(content || "");
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;

  try {
    return JSON.parse(candidate.trim());
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("AI did not return structured JSON");
    }
    return JSON.parse(candidate.slice(start, end + 1));
  }
};

const asStringArray = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item)).filter(Boolean)
    : String(value || "")
        .split("\n")
        .map((item) => item.replace(/^\s*[-*]\s*/, "").trim())
        .filter(Boolean);

const ANALYZE_SYSTEM_PROMPT = `You are a careful business analyst. Given the source material below, produce structured analysis.
Return ONLY minified JSON with these keys:
{
  "title": string,
  "summary": string (2-5 sentences),
  "insights": [string] (meaningful patterns or takeaways),
  "observations": [string] (neutral factual observations),
  "recommendations": [string] (specific, actionable next steps)
}
Rules:
- Ground every statement strictly in the provided material.
- NEVER invent data, numbers, names, dates, or conclusions not supported by the input.
- If the input is too thin to support a claim, say so in "observations" instead of guessing.
- Prefer 3-6 items per array; quality over quantity.`;

const runAnalysis = async ({ input, sourceType, context }) => {
  const userPrompt =
    `Source type: ${sourceType}.\n` +
    (context ? `Context: ${context}\n` : "") +
    `Material:\n${truncate(input)}`;

  const { content, model } = await groq.chatComplete({
    messages: [
      { role: "system", content: ANALYZE_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
  });

  const parsed = extractJson(content);
  return {
    title: parsed.title || "Analysis result",
    summary: parsed.summary || "",
    insights: asStringArray(parsed.insights),
    observations: asStringArray(parsed.observations),
    recommendations: asStringArray(parsed.recommendations),
    aiModel: model,
  };
};

// Assemble an analysis target from persisted project data.
const buildSourcePayload = async ({ scope, noteId, text }) => {
  if (noteId) {
    const note = await AiNote.findById(noteId);
    if (!note) {
      return { error: "Selected note does not exist" };
    }
    return {
      text: `${note.title}\n${note.summary || ""}\n${note.content || ""}\n${note.transcription || ""}`.trim(),
      sourceType: "notes",
      sourceRef: "note",
      sourceRefId: String(note._id),
    };
  }

  if (scope === "notes") {
    const notes = await AiNote.find().sort({ updatedAt: -1 }).limit(25);
    if (!notes.length) return { error: "No notes to analyze yet" };
    return {
      text: notes
        .map((n) => `# ${n.title}\n${n.summary || ""}\n${n.content || ""}`)
        .join("\n\n"),
      sourceType: "notes",
      sourceRef: "all-notes",
    };
  }

  if (scope === "recordings") {
    const recordings = await MediaRecording.find()
      .sort({ createdAt: -1 })
      .limit(25);
    if (!recordings.length) return { error: "No recordings to analyze yet" };
    return {
      text: recordings
        .map(
          (r) =>
            `# ${r.title} (${r.kind}, ${r.duration || 0}s)\n${r.description || "(no description)"}`
        )
        .join("\n\n"),
      sourceType: "recordings",
      sourceRef: "all-recordings",
    };
  }

  if (scope === "products") {
    const products = await Product.find({ isActive: true })
      .select("title price discountPrice stock category featured displayOrder")
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(100);
    if (!products.length) return { error: "No active products to analyze" };
    return {
      text: products
        .map(
          (p) =>
            `- ${p.title} | category: ${p.category || "n/a"} | price: ${p.price} | discount: ${
              p.discountPrice || 0
            } | stock: ${p.stock || 0} | featured: ${Boolean(p.featured)}`
        )
        .join("\n"),
      sourceType: "products",
      sourceRef: "active-products",
    };
  }

  if (scope === "combos") {
    const combos = await Combo.find({ isActive: true }).sort({ displayOrder: 1 });
    if (!combos.length) return { error: "No active combos to analyze" };
    return {
      text: combos
        .map(
          (c) =>
            `- ${c.name} | tagline: ${c.tagline || "n/a"} | MRP: ${c.original_price} | price: ${c.price} | savings: ${c.savings_pct || 0}% | included: ${
              (c.included || []).join(", ") || "none listed"
            }`
        )
        .join("\n"),
      sourceType: "products",
      sourceRef: "active-combos",
    };
  }

  if (scope === "text" || scope === "custom") {
    if (!text || !String(text).trim()) {
      return { error: "No text provided to analyze" };
    }
    return { text, sourceType: "text", sourceRef: "manual-text" };
  }

  return { error: `Unknown analysis scope: ${scope}` };
};

// @desc    List saved analyses
// @route   GET /api/ai/analysis
exports.getAnalyses = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.userId) filter.user = req.userId;

  const query = String(req.query.q || "").trim();
  if (query) filter.title = new RegExp(query, "i");

  const analyses = await AiAnalysis.find(filter)
    .sort({ updatedAt: -1 })
    .select("-rawInput");

  res.status(200).json({ success: true, analyses });
});

// @desc    Get one saved analysis
// @route   GET /api/ai/analysis/:id
exports.getAnalysis = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.userId) filter.user = req.userId;

  const analysis = await AiAnalysis.findOne(filter);
  if (!analysis) {
    return res
      .status(404)
      .json({ success: false, message: "Analysis not found" });
  }

  res.status(200).json({ success: true, analysis });
});

// @desc    Run an analysis and persist the result
// @route   POST /api/ai/analysis
// body: { scope: "notes"|"recordings"|"products"|"combos"|"text",
//         noteId?, text?, title?, context?, save? }
exports.createAnalysis = asyncHandler(async (req, res) => {
  if (!groq.isConfigured()) {
    return res.status(503).json({
      success: false,
      message: "AI analysis is currently disabled because GROQ_API_KEY is not configured in server/.env",
      isConfigured: false,
    });
  }

  const body = req.body || {};
  const { scope, noteId, text, title, context = "", save = true } = body;

  const payload = await buildSourcePayload({ scope, noteId, text });
  if (payload.error) {
    return res.status(400).json({ success: false, message: payload.error });
  }

  const result = await runAnalysis({
    input: payload.text,
    sourceType: payload.sourceType,
    context,
  });

  if (save) {
    const analysis = await AiAnalysis.create({
      title: title || result.title,
      summary: result.summary,
      insights: result.insights,
      observations: result.observations,
      recommendations: result.recommendations,
      rawInput: payload.text,
      sourceType: payload.sourceType,
      sourceRef: payload.sourceRef,
      sourceRefId: payload.sourceRefId,
      aiModel: result.aiModel,
      user: req.userId,
    });
    return res.status(201).json({ success: true, analysis });
  }

  res.status(200).json({ success: true, analysis: result, saved: false });
});

// @desc    Update a saved analysis
// @route   PUT /api/ai/analysis/:id
exports.updateAnalysis = asyncHandler(async (req, res) => {
  const allowed = {};
  ["title", "summary", "insights", "observations", "recommendations"].forEach((key) => {
    if (req.body[key] !== undefined) allowed[key] = req.body[key];
  });

  const analysis = await AiAnalysis.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    allowed,
    { new: true, runValidators: true }
  );

  if (!analysis) {
    return res
      .status(404)
      .json({ success: false, message: "Analysis not found" });
  }

  res.status(200).json({ success: true, analysis });
});

// @desc    Delete a saved analysis
// @route   DELETE /api/ai/analysis/:id
exports.deleteAnalysis = asyncHandler(async (req, res) => {
  const analysis = await AiAnalysis.findOneAndDelete({
    _id: req.params.id,
    user: req.userId,
  });

  if (!analysis) {
    return res
      .status(404)
      .json({ success: false, message: "Analysis not found" });
  }

  res.status(200).json({ success: true, message: "Analysis deleted" });
});

// @desc    Transcribe uploaded media (for the analyzer's media input mode)
// @route   POST /api/ai/analysis/transcribe
exports.transcribeMedia = asyncHandler(async (req, res) => {
  if (!groq.isConfigured()) {
    return res.status(503).json({
      success: false,
      message: "AI transcription is currently disabled because GROQ_API_KEY is not configured in server/.env",
      isConfigured: false,
    });
  }

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "Audio or video file is required" });
  }

  const buffer = req.file.buffer;
  const ext = String(req.file.mimetype || "")
    .split("/")
    .pop()
    .slice(0, 5) || "webm";
  const tmp = path.join(os.tmpdir(), `alaira-an-${Date.now()}.${ext}`);
  fs.writeFileSync(tmp, buffer);

  try {
    const result = await groq.transcribe({
      file: new Blob([buffer], { type: req.file.mimetype }),
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    return res.status(200).json({
      success: true,
      transcript: result.transcript,
      model: result.model,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: `Transcription failed: ${error.message}`,
    });
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {}
  }
});
