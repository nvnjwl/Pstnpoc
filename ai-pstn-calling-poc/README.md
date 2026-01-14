# AI PSTN Calling POC

Production-grade proof-of-concept that dials PSTN numbers via Exotel, streams audio into Gemini Realtime, and streams AI audio back into the call. Backend serves the frontend build for single-service deployment (Render).

## Structure

```
ai-pstn-calling-poc/
  backend/
  frontend/
  scripts/
```

## Quick Start (Local)

1. **Backend**
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run dev
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Frontend runs at `http://localhost:5173` and proxies API/WS to `http://localhost:3000`.

## Build + Serve (Production)

```bash
./scripts/build-and-copy-frontend.sh
cd backend
npm install
npm run build
npm start
```

The backend will serve the built React app from `backend/public`.

## Render Deploy Guide

1. Create a new Render Web Service pointing to the repo.
2. Set build command:
   ```bash
   ./scripts/build-and-copy-frontend.sh && cd backend && npm install && npm run build
   ```
3. Set start command:
   ```bash
   cd backend && npm start
   ```
4. Add environment variables from `backend/.env.example` (use real values).

## Mock Mode

Set `MOCK_MODE=true` in `backend/.env` to simulate call statuses and Gemini audio for UI testing without Exotel credits.

## Notes

- Exotel will request `/api/exotel/connect` to obtain XML that instructs the call to connect to the WebSocket stream.
- Status updates from Exotel should be sent to `/api/exotel/status`.
- UI connects to `/ws/ui/session` for live statuses and transcript updates.

See `backend/README.md` and `frontend/README.md` for more details.
