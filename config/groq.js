const GROQ_BASE = "https://api.groq.com/openai/v1";
const DEFAULT_CHAT_MODEL = process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b";
const DEFAULT_STT_MODEL = process.env.GROQ_STT_MODEL || "whisper-large-v3";

const getApiKey = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is not configured. Add it to server/.env");
  }
  return key;
};

const getChatModel = () =>
  process.env.GROQ_CHAT_MODEL || DEFAULT_CHAT_MODEL;

const getSttModel = () =>
  process.env.GROQ_STT_MODEL || DEFAULT_STT_MODEL;

const isConfigured = () => Boolean(process.env.GROQ_API_KEY);

const chatComplete = async ({ messages, model, temperature = 0.4, maxTokens }) => {
  const apiKey = getApiKey();
  const chosenModel = model || getChatModel();

  const response = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: chosenModel,
      messages,
      temperature,
      ...(maxTokens ? { max_tokens: maxTokens } : {}),
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Groq chat request failed (${response.status}): ${text.slice(0, 500)}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned an empty completion");
  }

  return { content, model: chosenModel };
};

const transcribe = async ({
  file,
  fileName,
  mimeType,
  model,
  language,
}) => {
  const apiKey = getApiKey();
  const chosenModel = model || getSttModel();

  const form = new FormData();
  form.append("file", file, fileName || "recording.webm");
  form.append("model", chosenModel);
  form.append("response_format", "json");
  if (language) form.append("language", language);

  const response = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Groq transcription failed (${response.status}): ${text.slice(0, 500)}`
    );
  }

  const data = await response.json();
  return { transcript: data?.text || "", model: chosenModel };
};

module.exports = {
  GROQ_BASE,
  DEFAULT_CHAT_MODEL,
  DEFAULT_STT_MODEL,
  getApiKey,
  getChatModel,
  getSttModel,
  isConfigured,
  chatComplete,
  transcribe,
};
