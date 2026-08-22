const PRIMARY_MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

// Aliases Google keeps pointed at a current model, so this list stays valid
// even after specific model versions (e.g. gemini-2.5-flash) are retired.
const FALLBACK_MODELS = ["gemini-flash-lite-latest", "gemini-pro-latest"];

const MODEL_CHAIN = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter((m) => m !== PRIMARY_MODEL)];

const RETRYABLE_STATUSES = new Set([429, 503]);
const MAX_ATTEMPTS_PER_MODEL = 2;
const BASE_DELAY_MS = 1000;

export class GeminiUnavailableError extends Error {}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callModel(model: string, apiKey: string, prompt: string): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    }

    if (RETRYABLE_STATUSES.has(res.status) && attempt < MAX_ATTEMPTS_PER_MODEL) {
      await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
      continue;
    }
    return null;
  }
  return null;
}

export async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY must be set to use the reflection feature");
  }

  for (const model of MODEL_CHAIN) {
    const text = await callModel(model, apiKey, prompt);
    if (text) return text;
  }

  throw new GeminiUnavailableError("All Gemini models were unavailable");
}
