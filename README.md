# franklin

Backend for a Ben Franklin style 13-virtues daily tracker. Express API backed by SQLite, with an AI chat endpoint powered by Amazon Bedrock.

## Requirements

- Node.js
- AWS credentials with Bedrock access (only needed for `/api/chat`)

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
| --- | --- |
| `PORT` | Port to listen on (default `3001`) |
| `AWS_BEARER_TOKEN_BEDROCK` | Bearer token for Bedrock API access |
| `AWS_REGION` | AWS region for the Bedrock client |
| `BEDROCK_CHAT_MODEL` | Bedrock model id used for chat (default `us.amazon.nova-2-lite-v1:0`) |

## Running

```bash
npm run dev    # tsx watch, for local development
npm run build  # compile TypeScript to dist/
npm start      # run the compiled build (node dist/index.js)
```

The server listens on `http://localhost:3001` by default.

## Data

Uses a SQLite database at `data/franklin.db` (created automatically, WAL mode). On first run it seeds the 13 virtues and sets the tracking cycle's start date to the most recent Monday.

## API

All routes are mounted under `/api`.

### `GET /api/virtues`

Returns the list of virtues in order.

```json
[{ "id": 1, "name": "Temperance", "precept": "...", "sortOrder": 0 }, ...]
```

### `GET /api/entries?start=YYYY-MM-DD&end=YYYY-MM-DD`

Returns fault entries within an inclusive date range.

```json
[{ "date": "2026-08-03", "virtueId": 1, "faulted": true }, ...]
```

### `PUT /api/entries`

Upserts whether a virtue was faulted on a given date.

```json
// request body
{ "date": "2026-08-03", "virtueId": 1, "faulted": true }
```

### `GET /api/focus?date=YYYY-MM-DD`

Returns the virtue that's the focus of the week containing `date`, based on the weekly rotation cycle.

```json
{ "virtueId": 3, "weekStart": "2026-08-03", "weekEnd": "2026-08-09" }
```

### `POST /api/chat`

Streams a chat response from Bedrock as Server-Sent Events. Requires `AWS_BEARER_TOKEN_BEDROCK` and `AWS_REGION` to be set.

```json
// request body
{ "messages": [{ "role": "user", "content": "..." }] }
```

Response is an SSE stream of `data: {"delta": "..."}` chunks, ending with an `event: done` (or `event: error`) message.
