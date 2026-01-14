# Backend

Node.js + Express server that manages Exotel calls, WebSocket audio streaming, Gemini realtime agent integration, and local JSON persistence.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Endpoints

- `POST /api/call/start` → start a call. Body: `{ "to": "+91xxxxxxxxxx" }`.
- `POST /api/exotel/status` → Exotel status callback.
- `POST /api/exotel/connect` → Exotel connect webhook returning XML with a WebSocket stream URL.

## WebSockets

- `GET /ws/exotel/stream?token=...&callSessionId=...` (Exotel audio stream)
- `GET /ws/ui/session?callSessionId=...` (UI updates)

## Storage

Call data is persisted to `backend/data/calls.json`.

## Mock Mode

Set `MOCK_MODE=true` to simulate Exotel status updates and Gemini audio responses.
