import { Router } from "express";
import { ConverseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { getBedrockClient, CHAT_MODEL } from "../bedrock.js";

export const chatRouter = Router();

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function isChatMessage(m: unknown): m is ChatMessage {
  if (typeof m !== "object" || m === null) return false;
  const { role, content } = m as Record<string, unknown>;
  return (role === "user" || role === "assistant") && typeof content === "string";
}

chatRouter.post("/", async (req, res) => {
  const { messages } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isChatMessage)) {
    res.status(400).json({ error: "messages must be a non-empty array of {role, content}" });
    return;
  }

  let client;
  try {
    client = getBedrockClient();
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "unknown error" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const command = new ConverseStreamCommand({
      modelId: CHAT_MODEL,
      messages: (messages as ChatMessage[]).map((m) => ({
        role: m.role,
        content: [{ text: m.content }],
      })),
    });

    const response = await client.send(command);

    for await (const event of response.stream ?? []) {
      const text = event.contentBlockDelta?.delta?.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
      }
    }
    res.write("event: done\ndata: {}\n\n");
  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: err instanceof Error ? err.message : "unknown error" })}\n\n`);
  } finally {
    res.end();
  }
});
