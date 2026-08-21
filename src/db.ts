import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { VIRTUES } from "./virtues.data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "franklin.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS virtues (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    precept TEXT NOT NULL,
    rationale TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS entries (
    date TEXT NOT NULL,
    virtue_id INTEGER NOT NULL REFERENCES virtues(id),
    faulted INTEGER NOT NULL DEFAULT 1,
    UNIQUE(date, virtue_id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

function migrateVirtues() {
  const columns = db.prepare("PRAGMA table_info(virtues)").all() as { name: string }[];
  if (!columns.some((c) => c.name === "rationale")) {
    db.exec("ALTER TABLE virtues ADD COLUMN rationale TEXT NOT NULL DEFAULT ''");
  }
}

function seedVirtues() {
  const count = db.prepare("SELECT COUNT(*) as c FROM virtues").get() as { c: number };
  if (count.c === 0) {
    const insert = db.prepare(
      "INSERT INTO virtues (id, name, precept, rationale, sort_order) VALUES (?, ?, ?, ?, ?)"
    );
    const insertMany = db.transaction(() => {
      VIRTUES.forEach((v, i) => insert.run(i + 1, v.name, v.precept, v.rationale, i));
    });
    insertMany();
    return;
  }

  const update = db.prepare("UPDATE virtues SET rationale = ? WHERE id = ? AND rationale = ''");
  const backfill = db.transaction(() => {
    VIRTUES.forEach((v, i) => update.run(v.rationale, i + 1));
  });
  backfill();
}

function seedCycleStart() {
  const existing = db.prepare("SELECT value FROM settings WHERE key = 'cycle_start_date'").get();
  if (existing) return;

  const now = new Date();
  const day = now.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diffToMonday);
  const cycleStart = monday.toISOString().slice(0, 10);

  db.prepare("INSERT INTO settings (key, value) VALUES ('cycle_start_date', ?)").run(cycleStart);
}

migrateVirtues();
seedVirtues();
seedCycleStart();

export function getCycleStart(): string {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'cycle_start_date'").get() as {
    value: string;
  };
  return row.value;
}
