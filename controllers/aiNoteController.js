const fs = require("fs");
const path = require("path");
const os = require("os");
const asyncHandler = require("../middleware/asyncHandler");
const AiNote = require("../models/AiNote");
const groq = require("../config/groq");

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const MAX_TRANSCRIPT_CHARS = 12000;
const truncateText = (text, max = MAX_TRANSCRIPT_CHARS) => {
  const clean = String(text || "");
  return clean.length > max ? `${clean.slice(0, max)}\n[truncated]` : clean;
};

// Pull the first valid JSON object out of an LLM reply, tolerating
// ```json fences and surrounding prose.
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
        .map((item) => item.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean);

// Stream a remote media URL into a local temp file for the STT endpoint.
const downloadToTemp = async (url, ext = "webm") => {
  const tmp = path.join(os.tmpdir(), `alaira-tx-${Date.now()}.${ext}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Source download failed (${response.status})`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) {
      throw new Error("Source media is empty");
    }
    fs.writeFileSync(tmp, buffer);
    return tmp;
  } catch (error) {
    return { error: error.message };
  }
};

const transcribeBuffer = async (buffer, fileName, mimeType) => {
  const ext = String(mimeType || "")
    .split("/")
    .pop()
    .slice(0, 5);
  const tmp = path.join(os.tmpdir(), `vastraaura-tx-${Date.now()}.${ext || "webm"}`);
  fs.writeFileSync(tmp, buffer);

  try {
    const blob = new Blob([buffer], { type: mimeType });
    const result = await groq.transcribe({
      file: blob,
      fileName: fileName || `recording.${ext || "webm"}`,
      mimeType,
    });
    return { transcript: result.transcript, model: result.model };
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {}
  }
};

const NOTE_SYSTEM_PROMPT = `You convert raw input into structured meeting-style notes.
Return ONLY minified JSON with these keys:
{
  "title": string,
  "summary": string (2-4 sentences),
  "headings": [string],
  "keyPoints": [string],
  "actionItems": [string],
  "content": string (well-organised markdown of the full notes)
}
Rules: use only information present in the input. Never invent facts, names, or numbers. If something is absent, omit it or leave it empty. Keep action items concrete and verifiable.`;

const generateNote = async ({ input, sourceType, context }) => {
  const userPrompt =
    `Source type: ${sourceType}.\n` +
    (context ? `Context: ${context}\n` : "") +
    `Input:\n${truncateText(input)}`;

  const { content, model } = await groq.chatComplete({
    messages: [
      { role: "system", content: NOTE_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
  });

  const parsed = extractJson(content);
  return {
    title: parsed.title || "Untitled note",
    summary: parsed.summary || "",
    headings: asStringArray(parsed.headings),
    keyPoints: asStringArray(parsed.keyPoints),
    actionItems: asStringArray(parsed.actionItems),
    content: parsed.content || content,
    aiModel: model,
  };
};

/* ------------------------------------------------------------------ *
 * Routes
 * ------------------------------------------------------------------ */

// @desc    List current user's notes
// @route   GET /api/ai/notes
exports.getNotes = asyncHandler(async (req, res) => {
  const filter = { user: req.userId };
  const query = String(req.query.q || "").trim();
  if (query) {
    filter.title = new RegExp(query, "i");
  }

  const notes = await AiNote.find(filter)
    .sort({ updatedAt: -1 })
    .select("-transcription");

  res.status(200).json({ success: true, notes });
});

// @desc    Get one note (full, incl. transcription)
// @route   GET /api/ai/notes/:id
exports.getNote = asyncHandler(async (req, res) => {
  const note = await AiNote.findOne({ _id: req.params.id, user: req.userId });
  if (!note) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }
  res.status(200).json({ success: true, note });
});

// @desc    Create a note — plain text, or from uploaded media + AI transcription
// @route   POST /api/ai/notes
// body: { title, content, sourceType, context, file (multipart) }
exports.createNote = asyncHandler(async (req, res) => {
  const body = req.body || {};
  let { title, content = "", sourceType = "manual", context = "" } = body;

  const hasFile = Boolean(req.file);
  if (!hasFile) {
    sourceType = "manual";
  }

  let transcription = "";
  let aiModel = "";
  let sourceFileUrl = "";
  let sourceFileName = "";
  let duration = Number(body.duration || 0);
  let mimeType = "";
  let summary = "";
  let keyPoints = [];
  let actionItems = [];
  let headings = [];

  if (hasFile && (sourceType === "audio" || sourceType === "video")) {
    // Real transcription through Groq — no fabricated text.
    const result = await transcribeBuffer(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    transcription = result.transcript || "";
    aiModel = result.model;
    sourceFileUrl = req.file.path;
    sourceFileName = req.file.originalname;
    mimeType = req.file.mimetype;

    if (!transcription.trim()) {
      return res.status(422).json({
        success: false,
        message:
          "No speech could be detected in the recording. Please re-record with clear audio.",
      });
    }

    if (!title) title = "Recording note";
  }

  const generateWithAI = req.body.generateAI === "true" || req.body.generateAI === true;
  if (generateWithAI && (transcription || content)) {
    const generated = await generateNote({
      input: transcription || content,
      sourceType,
      context,
    });
    summary = generated.summary;
    keyPoints = generated.keyPoints;
    actionItems = generated.actionItems;
    headings = generated.headings;
    if (!title) title = generated.title;
    content = generated.content || content;
    if (generated.aiModel && !aiModel) aiModel = generated.aiModel;
  }

  const note = await AiNote.create({
    title: title || "Untitled note",
    content,
    summary,
    keyPoints,
    actionItems,
    headings,
    transcription,
    sourceType,
    sourceFileUrl,
    sourceFileName,
    duration,
    mimeType,
    aiModel,
    user: req.userId,
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
  });

  res.status(201).json({ success: true, message: "Note saved", note });
});

// @desc    Generate a note from an already-uploaded recording URL
// @route   POST /api/ai/notes/from-url
// body: { url, sourceType, title, context }
exports.createNoteFromUrl = asyncHandler(async (req, res) => {
  const { url, sourceType = "audio", title, context = "" } = req.body || {};

  if (!url || !/^https?:\/\//.test(url)) {
    return res
      .status(400)
      .json({ success: false, message: "A valid media URL is required" });
  }

  const ext = String(url).split("?")[0].split(".").pop() || "webm";
  const downloaded = await downloadToTemp(url, ext);
  if (downloaded && downloaded.error) {
    return res
      .status(400)
      .json({ success: false, message: downloaded.error });
  }

  let tmpPath = downloaded;
  let transcription = "";
  let aiModel = "";

  try {
    const buffer = fs.readFileSync(tmpPath);
    const mimeType = ext === "webm" ? "video/webm" : `audio/${ext}`;
    const result = await groq.transcribe({
      file: new Blob([buffer], { type: mimeType }),
      fileName: `recording.${ext}`,
      mimeType,
    });
    transcription = result.transcript || "";
    aiModel = result.model;
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: `Transcription failed: ${error.message}`,
    });
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {}
  }

  if (!transcription.trim()) {
    return res.status(422).json({
      success: false,
      message: "No speech could be detected in the recording.",
    });
  }

  const generated = await generateNote({
    input: transcription,
    sourceType,
    context,
  });

  const note = await AiNote.create({
    title: title || generated.title,
    content: generated.content,
    summary: generated.summary,
    keyPoints: generated.keyPoints,
    actionItems: generated.actionItems,
    headings: generated.headings,
    transcription,
    sourceType,
    sourceFileUrl: url,
    mimeType: String(url).includes("/video/") || ext === "mp4" ? "video/mp4" : "audio/webm",
    aiModel: generated.aiModel || aiModel,
    user: req.userId,
  });

  res.status(201).json({ success: true, message: "Note generated", note });
});

// @desc    Update a note
// @route   PUT /api/ai/notes/:id
exports.updateNote = asyncHandler(async (req, res) => {
  const allowed = {};
  [
    "title",
    "content",
    "summary",
    "keyPoints",
    "actionItems",
    "headings",
    "transcription",
    "sourceType",
    "tags",
    "metadata",
  ].forEach((key) => {
    if (req.body[key] !== undefined) allowed[key] = req.body[key];
  });

  const note = await AiNote.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    allowed,
    { new: true, runValidators: true }
  );

  if (!note) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }

  res.status(200).json({ success: true, note });
});

// @desc    Delete a note
// @route   DELETE /api/ai/notes/:id
exports.deleteNote = asyncHandler(async (req, res) => {
  const note = await AiNote.findOneAndDelete({
    _id: req.params.id,
    user: req.userId,
  });

  if (!note) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }

  res.status(200).json({ success: true, message: "Note deleted" });
});

// @desc    Transcribe-only endpoint (no note persisted)
// @route   POST /api/ai/transcribe
exports.transcribeOnly = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "Audio or video file is required" });
  }

  const result = await transcribeBuffer(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );

  res.status(200).json({
    success: true,
    transcript: result.transcript,
    model: result.model,
  });
});
