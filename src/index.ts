import "dotenv/config";
import express from "express";
import cors from "cors";
import "./db.js";
import { virtuesRouter } from "./routes/virtues.js";
import { entriesRouter } from "./routes/entries.js";
import { focusRouter } from "./routes/focus.js";
import { chatRouter } from "./routes/chat.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/virtues", virtuesRouter);
app.use("/api/entries", entriesRouter);
app.use("/api/focus", focusRouter);
app.use("/api/chat", chatRouter);

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`franklin backend listening on port ${PORT}`);
});
