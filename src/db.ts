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

function dropIfNotPerUser(table: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (columns.length > 0 && !columns.some((c) => c.name === "user_id")) {
    db.exec(`DROP TABLE ${table}`);
  }
}

// entries/settings predate per-user scoping; drop and recreate rather than
// migrate, since that old data was never meaningfully multi-user anyway.
dropIfNotPerUser("entries");
dropIfNotPerUser("settings");

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
    user_id TEXT NOT NULL,
    faulted INTEGER NOT NULL DEFAULT 1,
    UNIQUE(date, virtue_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    user_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (user_id, key)
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

migrateVirtues();
seedVirtues();

export function getCycleStart(userId: string): string {
  const row = db
    .prepare("SELECT value FROM settings WHERE user_id = ? AND key = 'cycle_start_date'")
    .get(userId) as { value: string } | undefined;
  if (row) return row.value;

  const now = new Date();
  const day = now.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diffToMonday);
  const cycleStart = monday.toISOString().slice(0, 10);

  db.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'cycle_start_date', ?)").run(
    userId,
    cycleStart
  );
  return cycleStart;
}
