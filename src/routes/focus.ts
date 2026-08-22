import { Router } from "express";
import { getCycleStart } from "../db.js";
import { computeFocusVirtueId, weekEndFor, weekStartFor } from "../focus.js";

export const focusRouter = Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

focusRouter.get("/", (req, res) => {
  const { date } = req.query;
  if (typeof date !== "string" || !DATE_RE.test(date)) {
    res.status(400).json({ error: "date must be YYYY-MM-DD" });
    return;
  }

  const cycleStart = getCycleStart(req.userId);
  const weekStart = weekStartFor(date);
  const weekEnd = weekEndFor(weekStart);
  const virtueId = computeFocusVirtueId(date, cycleStart);

  res.json({ virtueId, weekStart, weekEnd });
});
