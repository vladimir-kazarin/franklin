# 13virtues

A Ben Franklin style 13-virtues daily tracker. React frontend, Express + SQLite backend, deployed at [13virtues.org](https://13virtues.org).

Each visitor gets a private, anonymous identity (an httpOnly cookie) — fault entries and the weekly focus rotation are scoped per-browser, not shared globally.

## Project structure

- `src/` — Express API (TypeScript, compiled to `dist/`)
- `frontend/` — React + Vite frontend (`frontend/src`, builds to `frontend/dist`)
- `data/` — SQLite database (gitignored, created automatically)

In production, the Express server serves the built frontend and the API from a single process/port — no separate frontend host, no CORS.

## Requirements

- Node.js 22+
- A [Gemini API key](https://aistudio.google.com/) (only needed for `/api/reflect`)
- AWS credentials with Bedrock access (only needed for the legacy `/api/chat` route, currently unused by the UI)

## Local development

Runs as two processes: the backend on `:3001`, and the Vite dev server on `:5174` (which proxies `/api/*` to the backend — see `frontend/vite.config.ts`). No `VITE_API_URL` or CORS config needed; keep it that way.

```bash
# backend
npm install
cp .env.example .env   # fill in GEMINI_API_KEY etc.
npm run dev

# frontend, in a separate terminal
cd frontend
npm install
npm run dev
```

Open `http://localhost:5174`.

### Environment variables (`.env`)

| Variable | Description |
| --- | --- |
| `PORT` | Port to listen on (default `3001`) |
| `GEMINI_API_KEY` | Google Gemini API key, used by `/api/reflect` |
| `GEMINI_MODEL` | Gemini model id (default `gemini-flash-latest`, an alias Google keeps pointed at a current model) |
| `AWS_BEARER_TOKEN_BEDROCK` | Bearer token for Bedrock API access (legacy `/api/chat` only) |
| `AWS_REGION` | AWS region for the Bedrock client |
| `BEDROCK_CHAT_MODEL` | Bedrock model id used for chat (default `us.amazon.nova-2-lite-v1:0`) |

## Data & identity

SQLite database at `data/franklin.db` (WAL mode, created automatically). On first run it seeds the 13 virtues.

Every request to `/api/*` is scoped by a `uid` cookie: a random UUID issued on first visit (httpOnly, `secure` in production, `SameSite=Lax`, ~1 year expiry — see `src/identity.ts`). `entries` and `settings` (which holds each user's `cycle_start_date`, determining their weekly focus virtue) are keyed by that id, so different browsers never see or overwrite each other's data. `virtues` (the reference data) stays shared/global.

Schema changes to `entries`/`settings` are handled by ad-hoc, idempotent checks in `src/db.ts` that run on every boot (no migration framework) — see `dropIfNotPerUser`/`migrateVirtues` for the pattern.

## API

All routes are mounted under `/api`.

### `GET /api/virtues`

Returns the list of virtues in order.

```json
[{ "id": 1, "name": "Temperance", "precept": "...", "rationale": "...", "sortOrder": 0 }, ...]
```

### `GET /api/entries?start=YYYY-MM-DD&end=YYYY-MM-DD`

Returns the caller's fault entries within an inclusive date range.

```json
[{ "date": "2026-08-03", "virtueId": 1, "faulted": true }, ...]
```

### `PUT /api/entries`

Upserts whether a virtue was faulted on a given date, for the caller.

```json
// request body
{ "date": "2026-08-03", "virtueId": 1, "faulted": true }
```

### `GET /api/focus?date=YYYY-MM-DD`

Returns the virtue that's the focus of the week containing `date`, based on the caller's weekly rotation cycle (seeded the first time they're seen).

```json
{ "virtueId": 3, "weekStart": "2026-08-03", "weekEnd": "2026-08-09" }
```

### `POST /api/reflect`

Given a week's worth of faults, returns a short Franklin-voiced reflection generated via Gemini. Retries across a small chain of models on transient failures; returns `503 { code: "unavailable" }` if all of them fail.

```json
// request body
{
  "weekStart": "2026-08-03",
  "weekEnd": "2026-08-09",
  "focusVirtueName": "Sincerity",
  "faults": [{ "virtueName": "Resolution", "date": "2026-08-03" }]
}
```

### `POST /api/chat`

Legacy route, not called by the current UI. Streams a chat response from Bedrock as Server-Sent Events. Requires `AWS_BEARER_TOKEN_BEDROCK` and `AWS_REGION`.

## Production build & deployment

```bash
npm run build             # backend: tsc -> dist/
cd frontend && npm run build   # frontend: vite build -> frontend/dist/
npm start                 # node dist/index.js, serves both
```

Deployed to [Fly.io](https://fly.io) (`fly.toml`, `Dockerfile`): a single always-on machine in `iad`, with a persistent volume mounted at `/app/data` for the SQLite file (SQLite is single-writer, so this app intentionally never runs more than one machine). Secrets (`GEMINI_API_KEY`, etc.) are set via `fly secrets`, not committed.

```bash
fly deploy --app 13virtues
```
