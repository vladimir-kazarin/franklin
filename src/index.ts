import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./db.js";
import { identityMiddleware } from "./identity.js";
import { virtuesRouter } from "./routes/virtues.js";
import { entriesRouter } from "./routes/entries.js";
import { focusRouter } from "./routes/focus.js";
import { chatRouter } from "./routes/chat.js";
import { reflectRouter } from "./routes/reflect.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, "..", "frontend", "dist");

const app = express();
app.use(express.json());
app.use("/api", identityMiddleware);

app.use("/api/virtues", virtuesRouter);
app.use("/api/entries", entriesRouter);
app.use("/api/focus", focusRouter);
app.use("/api/chat", chatRouter);
app.use("/api/reflect", reflectRouter);

app.use(express.static(frontendDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`franklin backend listening on port ${PORT}`);
});
