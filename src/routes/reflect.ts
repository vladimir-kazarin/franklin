import { Router } from "express";
import { generateWithGemini, GeminiUnavailableError } from "../gemini.js";

export const reflectRouter = Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface FaultEntry {
  virtueName: string;
  date: string;
}

function isFaultEntry(f: unknown): f is FaultEntry {
  if (typeof f !== "object" || f === null) return false;
  const { virtueName, date } = f as Record<string, unknown>;
  return typeof virtueName === "string" && typeof date === "string" && DATE_RE.test(date);
}

reflectRouter.post("/", async (req, res) => {
  const { weekStart, weekEnd, focusVirtueName, faults } = req.body ?? {};

  if (typeof weekStart !== "string" || !DATE_RE.test(weekStart)) {
    res.status(400).json({ error: "weekStart must be YYYY-MM-DD" });
    return;
  }
  if (typeof weekEnd !== "string" || !DATE_RE.test(weekEnd)) {
    res.status(400).json({ error: "weekEnd must be YYYY-MM-DD" });
    return;
  }
  if (typeof focusVirtueName !== "string" || focusVirtueName.length === 0) {
    res.status(400).json({ error: "focusVirtueName must be a non-empty string" });
    return;
  }
  if (!Array.isArray(faults) || !faults.every(isFaultEntry)) {
    res.status(400).json({ error: "faults must be an array of {virtueName, date}" });
    return;
  }

  const faultLines =
    faults.length === 0
      ? "No faults were marked this week."
      : (faults as FaultEntry[]).map((f) => `- ${f.date}: ${f.virtueName}`).join("\n");

  const prompt = `You are speaking as Benjamin Franklin, reflecting with someone practicing your 13-virtues self-improvement method from your autobiography.

This week (${weekStart} to ${weekEnd}) their focus virtue was: ${focusVirtueName}.

Here are the faults they marked against themselves this week:
${faultLines}

In 3-5 short sentences, written in Franklin's voice, reflect on their week: note any pattern you see, offer encouragement, and suggest one concrete, practical tip for the coming week. Keep it warm and brief, not preachy.`;

  try {
    const text = await generateWithGemini(prompt);
    res.json({ reflection: text });
  } catch (err) {
    if (err instanceof GeminiUnavailableError) {
      res.status(503).json({ error: err.message, code: "unavailable" });
      return;
    }
    res.status(500).json({ error: err instanceof Error ? err.message : "unknown error" });
  }
});
