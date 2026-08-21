import { Router } from "express";
import { db } from "../db.js";

export const entriesRouter = Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

entriesRouter.get("/", (req, res) => {
  const { start, end } = req.query;
  if (typeof start !== "string" || typeof end !== "string" || !DATE_RE.test(start) || !DATE_RE.test(end)) {
    res.status(400).json({ error: "start and end must be YYYY-MM-DD" });
    return;
  }

  const rows = db
    .prepare("SELECT date, virtue_id as virtueId, faulted FROM entries WHERE date >= ? AND date <= ?")
    .all(start, end) as { date: string; virtueId: number; faulted: number }[];

  res.json(rows.map((r) => ({ ...r, faulted: !!r.faulted })));
});

entriesRouter.put("/", (req, res) => {
  const { date, virtueId, faulted } = req.body ?? {};

  if (typeof date !== "string" || !DATE_RE.test(date)) {
    res.status(400).json({ error: "date must be YYYY-MM-DD" });
    return;
  }
  if (typeof virtueId !== "number" || !Number.isInteger(virtueId)) {
    res.status(400).json({ error: "virtueId must be an integer" });
    return;
  }
  if (typeof faulted !== "boolean") {
    res.status(400).json({ error: "faulted must be a boolean" });
    return;
  }

  db.prepare(
    `INSERT INTO entries (date, virtue_id, faulted) VALUES (?, ?, ?)
     ON CONFLICT(date, virtue_id) DO UPDATE SET faulted = excluded.faulted`
  ).run(date, virtueId, faulted ? 1 : 0);

  res.json({ date, virtueId, faulted });
});
