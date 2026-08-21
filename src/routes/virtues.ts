import { Router } from "express";
import { db } from "../db.js";
import type { Virtue } from "../types.js";

export const virtuesRouter = Router();

virtuesRouter.get("/", (_req, res) => {
  const rows = db
    .prepare(
      "SELECT id, name, precept, rationale, sort_order as sortOrder FROM virtues ORDER BY sort_order"
    )
    .all() as Virtue[];
  res.json(rows);
});
